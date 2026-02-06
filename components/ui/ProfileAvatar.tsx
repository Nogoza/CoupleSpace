// ============================================
// CoupleSpace - Profile Avatar Component
// ============================================

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
}

/**
 * Yeniden kullanılabilir yuvarlak profil avatar komponenti.
 * Profil fotoğrafı varsa gösterir, yoksa kullanıcının adının ilk harfini gösterir.
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    user,
    size = 50,
    style,
    showBorder = false,
    borderColor = '#FFF',
}) => {
    const hasAvatar = user?.avatarUrl && user.avatarUrl.trim() !== '';

    // Kullanıcı adının ilk harfini al
    const getInitial = (): string => {
        if (!user) return '?';
        const name = user.displayName || user.name || user.email || '';
        return name.charAt(0).toUpperCase() || '?';
    };

    // Harf için arka plan rengi (isim hash'ine göre)
    const getBackgroundColor = (): string => {
        if (!user) return '#E0E0E0';
        const name = user.displayName || user.name || user.email || '';
        const colors = [
            '#FF6B9D', // Pembe
            '#A78BFA', // Mor
            '#60A5FA', // Mavi
            '#34D399', // Yeşil
            '#FBBF24', // Sarı
            '#F97316', // Turuncu
            '#EC4899', // Fuşya
            '#8B5CF6', // Violet
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const containerStyle: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        ...(showBorder && {
            borderWidth: 2,
            borderColor,
        }),
    };

    if (hasAvatar) {
        return (
            <View style={[containerStyle, style]}>
                <ExpoImage
                    source={{ uri: user?.avatarUrl }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                />
            </View>
        );
    }

    // Fallback: Harfli avatar
    return (
        <View
            style={[
                containerStyle,
                {
                    backgroundColor: getBackgroundColor(),
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
                        fontSize: size * 0.4,
                    },
                ]}
            >
                {getInitial()}
            </Text>
        </View>
    );
};

// Partner için özel avatar (kalp emoji fallback)
export const PartnerAvatar: React.FC<ProfileAvatarProps> = (props) => {
    const { user, size = 50, style, showBorder, borderColor } = props;
    const hasAvatar = user?.avatarUrl && user.avatarUrl.trim() !== '';

    if (hasAvatar) {
        return <ProfileAvatar {...props} />;
    }

    // Partner için özel fallback - kalp emoji
    const containerStyle: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFE4EC',
        alignItems: 'center',
        justifyContent: 'center',
        ...(showBorder && {
            borderWidth: 2,
            borderColor: borderColor || '#FFF',
        }),
    };

    return (
        <View style={[containerStyle, style]}>
            <Text style={{ fontSize: size * 0.5 }}>💕</Text>
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
        fontWeight: '600',
    },
});

export default ProfileAvatar;
