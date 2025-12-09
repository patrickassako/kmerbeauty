import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { SignUpDto, SignInDto, AuthResponseDto, UserRole } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) { }

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    console.log('🔵 [SignUp] Starting signup process for:', dto.email);

    // Vérifier si l'email existe déjà dans notre table
    const { data: existingEmail } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existingEmail) {
      console.log('🔴 [SignUp] Email already exists:', dto.email);
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier si le téléphone existe déjà
    const { data: existingPhone } = await this.supabase
      .from('users')
      .select('id')
      .eq('phone', dto.phone)
      .single();

    if (existingPhone) {
      console.log('🔴 [SignUp] Phone already exists:', dto.phone);
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    // 1. Créer l'utilisateur dans Supabase Auth via ADMIN API (évite de connecter le client admin)
    console.log('🔵 [SignUp] Creating auth user via Admin API...');
    const { data: authData, error: authError } = await this.supabase
      .getClient()
      .auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true, // Auto-confirm email since we are admin
        user_metadata: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone,
        },
      });

    if (authError || !authData.user) {
      console.log('🔴 [SignUp] Auth creation failed:', authError);
      throw new ConflictException('Erreur lors de la création du compte: ' + authError?.message);
    }

    console.log('✅ [SignUp] Auth user created:', authData.user.id);

    // 2. Hasher le mot de passe pour notre table
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Créer l'entrée dans notre table users avec l'ID de Supabase Auth
    const userDataToInsert = {
      id: authData.user.id,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      first_name: dto.firstName,
      last_name: dto.lastName,
      role: dto.role,
      language: dto.language || 'FRENCH',
      city: dto.city,
      region: dto.region,
    };

    console.log('🔵 [SignUp] Inserting user into database:', {
      id: userDataToInsert.id,
      email: userDataToInsert.email,
      role: userDataToInsert.role,
    });

    const { data: user, error: insertError } = await this.supabase
      .from('users')
      .insert(userDataToInsert)
      .select()
      .single();

    if (insertError) {
      console.log('🔴 [SignUp] Database insert failed:', insertError);

      // Si l'insertion échoue, supprimer l'utilisateur de Supabase Auth
      console.log('🔵 [SignUp] Rolling back - deleting auth user...');
      try {
        await this.supabase.getClient().auth.admin.deleteUser(authData.user.id);
        console.log('✅ [SignUp] Auth user deleted successfully');
      } catch (deleteError) {
        console.log('🔴 [SignUp] Failed to delete auth user:', deleteError);
      }

      throw new ConflictException(
        `Erreur lors de la création du profil: ${insertError.message}`
      );
    }

    console.log('✅ [SignUp] User inserted into database successfully');

    // 5. Si c'est un PROVIDER, créer l'entrée dans la table therapists
    if (dto.role === UserRole.PROVIDER) {
      console.log('🔵 [SignUp] User is a PROVIDER, creating therapist profile...');

      const therapistData: any = {
        user_id: user.id,
        business_name: dto.businessName || `${dto.firstName} ${dto.lastName}`,
        professional_experience: dto.experience ? `${dto.experience} years` : '',
        experience: dto.experience || 0,
        is_mobile: dto.isMobile ?? true,
        latitude: dto.latitude || 0,
        longitude: dto.longitude || 0,
        city: dto.city || 'Unknown',
        region: dto.region || 'Unknown',
        service_zones: dto.city ? JSON.stringify([dto.city]) : JSON.stringify([]),
        is_active: false,
        profile_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        country: 'Cameroun',
        travel_radius: 20,
        travel_fee: 0,
      };

      // Handle location geometry
      if (dto.latitude && dto.longitude) {
        therapistData.location = `POINT(${dto.longitude} ${dto.latitude})`;
      } else {
        therapistData.location = `POINT(0 0)`;
      }

      // Use the admin client (this.supabase.from) which should be clean
      const { error: therapistError } = await this.supabase
        .from('therapists')
        .insert(therapistData);

      if (therapistError) {
        console.error('🔴 [SignUp] Failed to create therapist profile:', therapistError);
      } else {
        console.log('✅ [SignUp] Therapist profile created');
      }
    }

    // 4. Retourner les tokens
    // Pour cela, on doit se connecter. On utilise un client temporaire pour ne pas polluer le client admin.
    console.log('🔵 [SignUp] Signing in to get tokens...');

    const tempClient = this.supabase.createNewClient();
    const { data: signInData, error: signInError } = await tempClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (signInError || !signInData.session) {
      console.log('⚠️ [SignUp] Auto-login failed:', signInError);
      // Fallback: return user without tokens (client will need to login)
      return {
        accessToken: '',
        refreshToken: '',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          language: user.language,
        },
      };
    }

    console.log('✅ [SignUp] Signup completed successfully with tokens');
    return {
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        language: user.language,
      },
    };
  }

  async signIn(dto: SignInDto): Promise<AuthResponseDto> {
    // Chercher l'utilisateur par email ou téléphone
    let query = this.supabase.from('users').select('*');

    if (dto.emailOrPhone.includes('@')) {
      query = query.eq('email', dto.emailOrPhone);
    } else {
      query = query.eq('phone', dto.emailOrPhone);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }

    // Créer les tokens avec Supabase Auth
    // Utiliser un client temporaire pour ne pas polluer le client admin
    const tempClient = this.supabase.createNewClient();
    const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
      email: user.email,
      password: dto.password,
    });

    if (authError) {
      throw new UnauthorizedException('Erreur d\'authentification');
    }

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        language: user.language,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const tempClient = this.supabase.createNewClient();
    const { data, error } = await tempClient.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      throw new UnauthorizedException('Token invalide');
    }

    return {
      accessToken: data.session.access_token,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    const tempClient = this.supabase.createNewClient();
    await tempClient.auth.signOut();
  }

  async getCurrentUser(userId: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, phone, first_name, last_name, role, language, avatar, city, region, is_verified')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      language: user.language,
      avatar: user.avatar,
      city: user.city,
      region: user.region,
      isVerified: user.is_verified,
    };
  }
  async deleteAccount(userId: string): Promise<void> {
    console.log('🗑️ [DeleteAccount] Request to delete user:', userId);

    // 1. Delete from Supabase Auth (Admin API)
    // This is the most critical step. If this succeeds, the user can't login.
    const { error: authError } = await this.supabase.getClient().auth.admin.deleteUser(userId);

    if (authError) {
      console.error('🔴 [DeleteAccount] Failed to delete auth user:', authError);
      throw new ConflictException('Impossible de supprimer le compte: ' + authError.message);
    }

    console.log('✅ [DeleteAccount] Auth user deleted');

    // 2. Delete from public.users table
    // Note: If you have ON DELETE CASCADE set up in your DB, this might happen automatically
    // when the auth user is deleted (if linked) or you might need to do it manually.
    // Assuming manual cleanup for safety.
    const { error: dbError } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error('🔴 [DeleteAccount] Failed to delete user from DB:', dbError);
      // We don't throw here because the auth user is already gone, so effectively the account is deleted.
      // Just log it for manual cleanup if needed.
    } else {
      console.log('✅ [DeleteAccount] User deleted from DB');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    console.log('🔵 [ForgotPassword] Request for:', email);

    // Check if user exists first
    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal if user exists or not for security, but log it
      console.log('⚠️ [ForgotPassword] Email not found in DB');
      return;
    }

    const { error } = await this.supabase.getClient().auth.resetPasswordForEmail(email, {
      redirectTo: 'kmerservices://reset-password', // Deep link to app
    });

    if (error) {
      console.error('🔴 [ForgotPassword] Supabase error:', error);
      throw new ConflictException('Erreur lors de l\'envoi de l\'email: ' + error.message);
    }

    console.log('✅ [ForgotPassword] Reset email sent');
  }
}
