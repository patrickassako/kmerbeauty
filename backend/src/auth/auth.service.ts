import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { SignUpDto, SignInDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

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

    // 1. Créer l'utilisateur dans Supabase Auth (ceci crée aussi l'entrée dans auth.users)
    console.log('🔵 [SignUp] Creating auth user...');
    const { data: authData, error: authError } = await this.supabase
      .getClient()
      .auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          data: {
            first_name: dto.firstName,
            last_name: dto.lastName,
            phone: dto.phone,
          },
        },
      });

    if (authError || !authData.user) {
      console.log('🔴 [SignUp] Auth creation failed:', authError);
      throw new ConflictException('Erreur lors de la création du compte: ' + authError?.message);
    }

    console.log('✅ [SignUp] Auth user created:', authData.user.id);
    console.log('🔵 [SignUp] Session status:', authData.session ? 'Session created' : 'No session (email confirmation may be required)');

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
      language: userDataToInsert.language,
      city: userDataToInsert.city,
      region: userDataToInsert.region,
    });

    const { data: user, error: insertError } = await this.supabase
      .from('users')
      .insert(userDataToInsert)
      .select()
      .single();

    if (insertError) {
      console.log('🔴 [SignUp] Database insert failed:', insertError);
      console.log('🔴 [SignUp] Error details:', JSON.stringify(insertError, null, 2));

      // Si l'insertion échoue, supprimer l'utilisateur de Supabase Auth
      console.log('🔵 [SignUp] Rolling back - deleting auth user...');
      try {
        await this.supabase.getClient().auth.admin.deleteUser(authData.user.id);
        console.log('✅ [SignUp] Auth user deleted successfully');
      } catch (deleteError) {
        console.log('🔴 [SignUp] Failed to delete auth user:', deleteError);
      }

      throw new ConflictException(
        `Erreur lors de la création du profil: ${insertError.message || insertError.code || 'Unknown error'}. Details: ${JSON.stringify(insertError)}`
      );
    }

    console.log('✅ [SignUp] User inserted into database successfully');

    // 4. Retourner les tokens et les données utilisateur
    // Si pas de session (email confirmation requise), créer une réponse sans tokens
    if (!authData.session) {
      console.log('⚠️ [SignUp] No session - email confirmation may be required');
      throw new ConflictException(
        'Compte créé avec succès. Veuillez vérifier votre email pour confirmer votre compte avant de vous connecter.'
      );
    }

    console.log('✅ [SignUp] Signup completed successfully');
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
    const { data: authData, error: authError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({
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
    const { data, error } = await this.supabase
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      throw new UnauthorizedException('Token invalide');
    }

    return {
      accessToken: data.session.access_token,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    await this.supabase.getClient().auth.signOut();
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
}
