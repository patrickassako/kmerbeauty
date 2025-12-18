import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { space as spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { typography } from '../../design-system/typography';
import { shadows } from '../../design-system/shadows';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth(); // Assuming refreshUser exists in AuthContext, if not I'll need to check
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCity(user.city || '');
      setRegion(user.region || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSave = async () => {
    // Validation
    if (!firstName || !lastName || !email || !phone) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = avatar;

      // 1. Upload new image if picked
      if (pickedImage) {
        try {
          // Read file as base64
          const fileData = await FileSystem.readAsStringAsync(pickedImage, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Get file extension and content type
          const fileExt = pickedImage.split('.').pop()?.toLowerCase() || 'jpg';
          const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
          const fileName = `${user?.id}_${Date.now()}.${fileExt}`;

          // Convert base64 to Uint8Array
          const binaryString = atob(fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Upload to 'avatars' bucket
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, bytes, {
              contentType,
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get Public URL
          const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = data.publicUrl;
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          Alert.alert('Erreur', 'Impossible de télécharger l\'image. Le profil sera mis à jour sans la photo.');
          // Continue updating other fields
        }
      }

      // 2. Update User Profile
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          city: city,
          region: region,
          avatar: avatarUrl
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshUser();

      Alert.alert('Succès', 'Votre profil a été mis à jour', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);

      let errorMessage = 'Impossible de mettre à jour le profil';

      if (error.message?.includes('users_phone_key')) {
        errorMessage = 'Ce numéro de téléphone est déjà utilisé par un autre compte';
      } else if (error.message?.includes('users_email_key')) {
        errorMessage = 'Cet email est déjà utilisé par un autre compte';
      } else {
        errorMessage += ': ' + (error.message || 'Erreur inconnue');
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accès à la galerie pour changer votre photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Modifier le profil</Text>

        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder}>
                {(pickedImage || avatar) ? (
                  <Image
                    source={{ uri: pickedImage || avatar }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                  />
                ) : (
                  <Text style={styles.photoInitial}>
                    {firstName?.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.photoEditButton} onPress={handleChangePhoto}>
                <Ionicons name="camera" size={20} color={colors.black} />
              </TouchableOpacity>
            </View>
            <Text style={styles.photoHint}>Appuyez pour changer la photo</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Votre prénom"
                  placeholderTextColor={colors.gray400}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Votre nom"
                  placeholderTextColor={colors.gray400}
                />
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coordonnées</Text>
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { color: colors.gray500 }]}
                  value={email}
                  editable={false}
                  placeholder="votre@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.formGroup}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+237 6XX XXX XXX"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.gray400}
                />
              </View>
            </View>
            <Text style={styles.helperText}>
              Votre numéro sera utilisé pour les notifications SMS
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Votre ville"
                  placeholderTextColor={colors.gray400}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.formGroup}>
                <Text style={styles.label}>Région</Text>
                <TextInput
                  style={styles.input}
                  value={region}
                  onChangeText={setRegion}
                  placeholder="Votre région"
                  placeholderTextColor={colors.gray400}
                />
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.dangerButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.gray50,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
  },
  saveButton: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  saveText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    ...shadows.sm,
  },
  photoInitial: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray500,
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  photoHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  formGroup: {
    padding: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.black,
    paddingVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.md,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
});

export default EditProfileScreen;
