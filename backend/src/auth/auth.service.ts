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
    // Vérifier si l'email existe déjà
    const { data: existingEmail } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier si le téléphone existe déjà
    const { data: existingPhone } = await this.supabase
      .from('users')
      .select('id')
      .eq('phone', dto.phone)
      .single();

    if (existingPhone) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Créer l'utilisateur dans Supabase
    const { data: user, error } = await this.supabase
      .from('users')
      .insert({
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        first_name: dto.firstName,
        last_name: dto.lastName,
        role: dto.role,
        language: dto.language || 'FRENCH',
        city: dto.city,
        region: dto.region,
      })
      .select()
      .single();

    if (error) {
      throw new ConflictException('Erreur lors de la création du compte');
    }

    // Créer les tokens avec Supabase Auth
    const { data: authData, error: authError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({
        email: dto.email,
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
