// ============================================
// CoupleSpace - Tag Selector Component
// ============================================

import { BorderRadius, FontSizes, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { PopularTags } from '@/types';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { themeColors } = useApp();
  const [customTag, setCustomTag] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim()) {
      const formattedTag = customTag.startsWith('#')
        ? customTag.trim()
        : `#${customTag.trim()}`;
      if (!selectedTags.includes(formattedTag)) {
        onTagsChange([...selectedTags, formattedTag]);
      }
      setCustomTag('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Etiketler 🏷️
      </Text>

      {/* Popular Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
        contentContainerStyle={styles.tagsContent}
      >
        {PopularTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            style={[
              styles.tag,
              {
                backgroundColor: selectedTags.includes(tag)
                  ? themeColors.primary
                  : themeColors.primaryLight,
              },
            ]}
          >
            <Text
              style={[
                styles.tagText,
                {
                  color: selectedTags.includes(tag)
                    ? '#FFFFFF'
                    : themeColors.primaryDark,
                },
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Tag Input */}
      <View
        style={[
          styles.customTagContainer,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <TextInput
          value={customTag}
          onChangeText={setCustomTag}
          placeholder="Özel etiket ekle..."
          placeholderTextColor={themeColors.textSecondary}
          style={[styles.customTagInput, { color: themeColors.text }]}
          onSubmitEditing={addCustomTag}
        />
        <TouchableOpacity
          onPress={addCustomTag}
          style={[styles.addButton, { backgroundColor: themeColors.primary }]}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={[styles.selectedTitle, { color: themeColors.textSecondary }]}>
            Seçilenler:
          </Text>
          <View style={styles.selectedTags}>
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[
                  styles.selectedTag,
                  { backgroundColor: themeColors.accent + '20' },
                ]}
              >
                <Text style={[styles.selectedTagText, { color: themeColors.accent }]}>
                  {tag} ✕
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tagsScroll: {
    marginBottom: Spacing.md,
  },
  tagsContent: {
    paddingRight: Spacing.md,
  },
  tag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  tagText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingLeft: Spacing.md,
    overflow: 'hidden',
  },
  customTagInput: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.sm,
  },
  addButton: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  selectedContainer: {
    marginTop: Spacing.md,
  },
  selectedTitle: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  selectedTagText: {
    fontSize: FontSizes.sm,
  },
});
