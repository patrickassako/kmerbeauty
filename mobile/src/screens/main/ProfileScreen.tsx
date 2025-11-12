import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { normalizeFontSize, spacing } = useResponsive();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(20) }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: spacing(2.5), paddingTop: spacing(3) }]}
      >
        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <View style={[styles.profilePicture, { width: spacing(15), height: spacing(15), borderRadius: spacing(7.5) }]}>
            <Text style={[styles.profileInitial, { fontSize: normalizeFontSize(40) }]}>
              {user?.firstName?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { fontSize: normalizeFontSize(24), marginTop: spacing(2) }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.userEmail, { fontSize: normalizeFontSize(14), marginTop: spacing(0.5) }]}>
            {user?.email}
          </Text>
        </View>

        {/* User Info */}
        <View style={[styles.infoSection, { marginTop: spacing(4) }]}>
          <View style={[styles.infoItem, { paddingVertical: spacing(2) }]}>
            <Text style={[styles.infoLabel, { fontSize: normalizeFontSize(14) }]}>Phone</Text>
            <Text style={[styles.infoValue, { fontSize: normalizeFontSize(16) }]}>{user?.phone || 'Not set'}</Text>
          </View>

          <View style={[styles.infoItem, { paddingVertical: spacing(2) }]}>
            <Text style={[styles.infoLabel, { fontSize: normalizeFontSize(14) }]}>Role</Text>
            <Text style={[styles.infoValue, { fontSize: normalizeFontSize(16) }]}>
              {user?.role === 'CLIENT' ? 'Client' : 'Provider'}
            </Text>
          </View>

          <View style={[styles.infoItem, { paddingVertical: spacing(2) }]}>
            <Text style={[styles.infoLabel, { fontSize: normalizeFontSize(14) }]}>Language</Text>
            <Text style={[styles.infoValue, { fontSize: normalizeFontSize(16) }]}>
              {user?.language === 'FRENCH' ? 'Français' : 'English'}
            </Text>
          </View>

          <View style={[styles.infoItem, { paddingVertical: spacing(2) }]}>
            <Text style={[styles.infoLabel, { fontSize: normalizeFontSize(14) }]}>Location</Text>
            <Text style={[styles.infoValue, { fontSize: normalizeFontSize(16) }]}>
              {user?.city || 'Not set'}, {user?.region || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actionsSection, { marginTop: spacing(4) }]}>
          <TouchableOpacity
            style={[styles.actionButton, { paddingVertical: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(2) }]}
          >
            <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(16) }]}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { paddingVertical: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(2) }]}
          >
            <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(16) }]}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { paddingVertical: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(2) }]}
          >
            <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(16) }]}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signOutButton, { paddingVertical: spacing(2), borderRadius: spacing(1.5), marginTop: spacing(3) }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.signOutButtonText, { fontSize: normalizeFontSize(16) }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
  },
  contentContainer: {},
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  profilePicture: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  userName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  userEmail: {
    color: '#666',
  },
  infoSection: {},
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  actionsSection: {},
  actionButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
