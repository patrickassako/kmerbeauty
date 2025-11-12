import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.substring(7);

    try {
      // Vérifier le token avec Supabase
      const { data, error } = await this.supabase
        .getClient()
        .auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Token invalide');
      }

      // Récupérer les infos complètes de l'utilisateur
      const { data: userData } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Ajouter l'utilisateur à la requête
      request.user = {
        id: userData.id,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        accessToken: token,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentification échouée');
    }
  }
}
