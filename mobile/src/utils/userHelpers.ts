/**
 * Utility functions for user data manipulation
 */

export interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  [key: string]: any;
}

/**
 * Get the full name of a user from first_name and last_name
 * @param user User object with first_name and last_name
 * @returns Full name or fallback
 */
export const getFullName = (user?: User | null): string => {
  if (!user) return 'Utilisateur';

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  if (user.first_name) return user.first_name;
  if (user.last_name) return user.last_name;
  if (user.email) return user.email;

  return 'Utilisateur';
};

/**
 * Get the initials of a user
 * @param user User object with first_name and last_name
 * @returns User initials
 */
export const getUserInitials = (user?: User | null): string => {
  if (!user) return '?';

  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }

  if (user.first_name) return user.first_name.charAt(0).toUpperCase();
  if (user.last_name) return user.last_name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();

  return '?';
};
