import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { colors } from '../../design-system/colors';
import { space as spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { typography } from '../../design-system/typography';
import { shadows } from '../../design-system/shadows';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, signOut, switchRole, userMode } = useAuth();
  const { normalizeFontSize } = useResponsive();
  const { language } = useI18n();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const MenuOption = ({ icon, label, onPress, color = colors.black, showChevron = true }: any) => (
    <TouchableOpacity
      style={styles.menuOption}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color === colors.error ? colors.error + '10' : colors.gray50 }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color: color }]}>{label}</Text>
      {showChevron && <Ionicons name="chevron-forward" size={20} color={colors.gray400} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'fr' ? 'Mon Profil' : 'My Profile'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user?.firstName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="pencil" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'client' ? 'Client' : 'Provider'}
            </Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Compte' : 'Account'}
          </Text>
          <View style={styles.menuContainer}>
            <MenuOption
              icon="person-outline"
              label={language === 'fr' ? 'Informations personnelles' : 'Personal Information'}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="bag-handle-outline"
              label={language === 'fr' ? 'Mes Commandes' : 'My Orders'}
              onPress={() => navigation.navigate('Market', { screen: 'ClientOrders' })}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="location-outline"
              label={language === 'fr' ? 'Mes Adresses' : 'My Addresses'}
              onPress={() => { }}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Application' : 'Application'}
          </Text>
          <View style={styles.menuContainer}>
            <MenuOption
              icon="notifications-outline"
              label={language === 'fr' ? 'Notifications' : 'Notifications'}
              onPress={() => { }}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="language-outline"
              label={language === 'fr' ? 'Langue' : 'Language'}
              onPress={() => { }}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="help-circle-outline"
              label={language === 'fr' ? 'Aide & Support' : 'Help & Support'}
              onPress={() => { }}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.menuContainer}>
            <MenuOption
              icon="swap-horizontal-outline"
              label={
                user?.role === 'provider'
                  ? (userMode === 'client'
                    ? (language === 'fr' ? 'Passer en mode Prestataire' : 'Switch to Provider Mode')
                    : (language === 'fr' ? 'Passer en mode Client' : 'Switch to Client Mode'))
                  : (user?.therapist
                    ? (language === 'fr' ? 'Candidature en cours' : 'Application Pending')
                    : (language === 'fr' ? 'Devenir Prestataire' : 'Become a Provider'))
              }
              onPress={() => {
                if (user?.role === 'provider') {
                  switchRole();
                } else if (user?.therapist) {
                  alert(language === 'fr' ? 'Votre candidature est en cours d\'examen.' : 'Your application is under review.');
                } else {
                  navigation.navigate('BecomeProvider');
                }
              }}
              color={colors.info}
              showChevron={user?.role === 'client' && !user?.therapist}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="log-out-outline"
              label={language === 'fr' ? 'Déconnexion' : 'Sign Out'}
              onPress={handleSignOut}
              color={colors.error}
              showChevron={false}
            />
          </View>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray500,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.black,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56, // Align with text start
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});
