// ============================================
// CoupleSpace - Modern Profile Avatar Component
// ============================================

import { Shadows } from '@/constants/couple-theme';
import { User } from '@/types';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ProfileAvatarProps {
  user: User | null;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
  showRing?: boolean;
  ringColor?: string;
}

/**
 * Modern yuvarlak profil avatar komponenti.
 * Profil fotoğrafı varsa gösterir, yoksa kullanıcının adının ilk harfini gösterir.
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  user,
  size = 50,
  style,
  showBorder = false,
  borderColor = '#FFF',
  showRing = false,
  ringColor = '#F472B6',
}) => {
  const hasAvatar = user?.avatarUrl && user.avatarUrl.trim() !== '';

  const getInitial = (): string => {
    if (!user) return '?';
    const name = user.displayName || user.name || user.email || '';
    return name.charAt(0).toUpperCase() || '?';
  };

  const getGradientColor = (): [string, string] => {
    if (!user) return ['#E0E0E0', '#C0C0C0'];
    const name = user.displayName || user.name || user.email || '';
    const gradients: [string, string][] = [
      ['#F472B6', '#EC4899'],
      ['#A78BFA', '#8B5CF6'],
      ['#60A5FA', '#3B82F6'],
      ['#34D399', '#10B981'],
      ['#FBBF24', '#F59E0B'],
      ['#FB923C', '#F97316'],
      ['#F472B6', '#E11D48'],
      ['#818CF8', '#6366F1'],
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const ringSize = showRing ? 3 : 0;
  const ringGap = showRing ? 2 : 0;
  const totalSize = size + (ringSize + ringGap) * 2;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    ...(showBorder && {
      borderWidth: 2.5,
      borderColor,
    }),
  };

  const avatarContent = hasAvatar ? (
    <View style={[containerStyle, style]}>
      <ExpoImage
        source={{ uri: user?.avatarUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </View>
  ) : (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: getGradientColor()[0],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initialText,
          {
            fontSize: size * 0.38,
          },
        ]}
      >
        {getInitial()}
      </Text>
    </View>
  );

  if (showRing) {
    return (
      <View
        style={[
          {
            width: totalSize,
            height: totalSize,
            borderRadius: totalSize / 2,
            borderWidth: ringSize,
            borderColor: ringColor,
            alignItems: 'center',
            justifyContent: 'center',
          },
          Shadows.small,
        ]}
      >
        {avatarContent}
      </View>
    );
  }

  return avatarContent;
};

// Partner için özel avatar
export const PartnerAvatar: React.FC<ProfileAvatarProps> = (props) => {
  const { user, size = 50, style, showBorder, borderColor } = props;
  const hasAvatar = user?.avatarUrl && user.avatarUrl.trim() !== '';

  if (hasAvatar) {
    return <ProfileAvatar {...props} />;
  }

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    ...(showBorder && {
      borderWidth: 2.5,
      borderColor: borderColor || '#FFF',
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={{ fontSize: size * 0.45 }}>💕</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ProfileAvatar;
