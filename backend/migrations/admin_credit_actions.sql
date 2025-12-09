-- Function to allow admins to manually add credits to a provider
-- This handles both updating the balance and recording the transaction
CREATE OR REPLACE FUNCTION admin_add_credits(
  target_provider_id UUID,
  amount DECIMAL,
  reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin)
AS $$
DECLARE
  v_provider_type TEXT;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_user_id UUID;
BEGIN
  -- 1. Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- 2. Determine provider type and get current balance
  -- Try Therapist
  SELECT 'therapist', balance INTO v_provider_type, v_current_balance
  FROM provider_credits
  WHERE provider_id = target_provider_id AND provider_type = 'therapist';

  -- If not found, try Salon
  IF v_provider_type IS NULL THEN
    SELECT 'salon', balance INTO v_provider_type, v_current_balance
    FROM provider_credits
    WHERE provider_id = target_provider_id AND provider_type = 'salon';
  END IF;

  -- If still not found, create initial record (rare but possible if new)
  IF v_provider_type IS NULL THEN
    -- Check if it's a therapist
    IF EXISTS (SELECT 1 FROM therapists WHERE id = target_provider_id) THEN
      v_provider_type := 'therapist';
    ELSIF EXISTS (SELECT 1 FROM salons WHERE id = target_provider_id) THEN
      v_provider_type := 'salon';
    ELSE
      RAISE EXCEPTION 'Provider not found with ID %', target_provider_id;
    END IF;

    v_current_balance := 0;
    
    INSERT INTO provider_credits (provider_id, provider_type, balance, total_earned, total_spent)
    VALUES (target_provider_id, v_provider_type, 0, 0, 0);
  END IF;

  -- 3. Calculate new balance
  v_new_balance := v_current_balance + amount;

  -- 4. Update balance
  UPDATE provider_credits
  SET 
    balance = v_new_balance,
    total_earned = CASE WHEN amount > 0 THEN total_earned + amount ELSE total_earned END,
    updated_at = NOW()
  WHERE provider_id = target_provider_id AND provider_type = v_provider_type;

  -- 5. Record transaction
  INSERT INTO credit_transactions (
    provider_id,
    provider_type,
    amount,
    transaction_type,
    balance_before,
    balance_after,
    metadata
  ) VALUES (
    target_provider_id,
    v_provider_type,
    amount,
    reason, -- e.g., 'ADMIN_RECHARGE', 'CORRECTION'
    v_current_balance,
    v_new_balance,
    jsonb_build_object('admin_id', auth.uid(), 'note', 'Manual admin recharge')
  );

  -- 6. Log to admin_logs
  INSERT INTO admin_logs (admin_id, action, target, details)
  VALUES (
    auth.uid(),
    'ADD_CREDITS',
    target_provider_id::TEXT,
    jsonb_build_object('amount', amount, 'reason', reason, 'new_balance', v_new_balance)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'message', 'Credits added successfully'
  );
END;
$$;
