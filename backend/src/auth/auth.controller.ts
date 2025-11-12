import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('signout')
  @UseGuards(AuthGuard)
  async signOut(@Req() req: any) {
    return this.authService.signOut(req.user.accessToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.id);
  }
}
