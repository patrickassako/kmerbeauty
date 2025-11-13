-- ============================================
-- TRIGGERS AUTOMATIQUES POUR LES REVIEWS
-- ============================================
-- Ces triggers mettent à jour automatiquement les ratings et review_count
-- des thérapeutes et salons après chaque INSERT/UPDATE/DELETE sur reviews

-- ============================================
-- Fonction pour mettre à jour les stats d'un thérapeute
-- ============================================
CREATE OR REPLACE FUNCTION update_therapist_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_therapist_id UUID;
  v_avg_rating DECIMAL(3,2);
  v_review_count INTEGER;
BEGIN
  -- Déterminer le therapist_id concerné
  IF TG_OP = 'DELETE' THEN
    v_therapist_id := OLD.therapist_id;
  ELSE
    v_therapist_id := NEW.therapist_id;
  END IF;

  -- Si pas de therapist_id, on sort
  IF v_therapist_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculer les nouvelles stats
  SELECT
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM reviews
  WHERE therapist_id = v_therapist_id;

  -- Mettre à jour le thérapeute
  UPDATE therapists
  SET
    rating = COALESCE(v_avg_rating, 0),
    review_count = COALESCE(v_review_count, 0),
    updated_at = NOW()
  WHERE id = v_therapist_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fonction pour mettre à jour les stats d'un salon
-- ============================================
CREATE OR REPLACE FUNCTION update_salon_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_salon_id UUID;
  v_avg_rating DECIMAL(3,2);
  v_review_count INTEGER;
BEGIN
  -- Déterminer le salon_id concerné
  IF TG_OP = 'DELETE' THEN
    v_salon_id := OLD.salon_id;
  ELSE
    v_salon_id := NEW.salon_id;
  END IF;

  -- Si pas de salon_id, on sort
  IF v_salon_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculer les nouvelles stats
  SELECT
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM reviews
  WHERE salon_id = v_salon_id;

  -- Mettre à jour le salon
  UPDATE salons
  SET
    rating = COALESCE(v_avg_rating, 0),
    review_count = COALESCE(v_review_count, 0),
    updated_at = NOW()
  WHERE id = v_salon_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Créer les triggers
-- ============================================

-- Trigger pour les thérapeutes (après INSERT)
DROP TRIGGER IF EXISTS trigger_therapist_review_insert ON reviews;
CREATE TRIGGER trigger_therapist_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  WHEN (NEW.therapist_id IS NOT NULL)
  EXECUTE FUNCTION update_therapist_rating_stats();

-- Trigger pour les thérapeutes (après UPDATE)
DROP TRIGGER IF EXISTS trigger_therapist_review_update ON reviews;
CREATE TRIGGER trigger_therapist_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  WHEN (NEW.therapist_id IS NOT NULL)
  EXECUTE FUNCTION update_therapist_rating_stats();

-- Trigger pour les thérapeutes (après DELETE)
DROP TRIGGER IF EXISTS trigger_therapist_review_delete ON reviews;
CREATE TRIGGER trigger_therapist_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  WHEN (OLD.therapist_id IS NOT NULL)
  EXECUTE FUNCTION update_therapist_rating_stats();

-- Trigger pour les salons (après INSERT)
DROP TRIGGER IF EXISTS trigger_salon_review_insert ON reviews;
CREATE TRIGGER trigger_salon_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  WHEN (NEW.salon_id IS NOT NULL)
  EXECUTE FUNCTION update_salon_rating_stats();

-- Trigger pour les salons (après UPDATE)
DROP TRIGGER IF EXISTS trigger_salon_review_update ON reviews;
CREATE TRIGGER trigger_salon_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  WHEN (NEW.salon_id IS NOT NULL)
  EXECUTE FUNCTION update_salon_rating_stats();

-- Trigger pour les salons (après DELETE)
DROP TRIGGER IF EXISTS trigger_salon_review_delete ON reviews;
CREATE TRIGGER trigger_salon_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  WHEN (OLD.salon_id IS NOT NULL)
  EXECUTE FUNCTION update_salon_rating_stats();

-- ============================================
-- ✅ TRIGGERS CRÉÉS
-- ============================================
-- Les ratings et review_count se mettent maintenant à jour automatiquement :
-- - Quand une review est ajoutée (INSERT)
-- - Quand une review est modifiée (UPDATE)
-- - Quand une review est supprimée (DELETE)
--
-- Plus besoin de mettre à jour manuellement dans le code !
