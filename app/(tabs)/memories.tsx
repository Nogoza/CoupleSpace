// ============================================
// CoupleSpace - Memories Screen
// ============================================

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfettiAnimation } from '@/components/ui/SuccessAnimation';
import { BorderRadius, FontSizes, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import {
  CoupleTodo,
  DatePlan,
  MemoryCategory,
  MemoryCategoryLabels,
  TodoCategory,
  TodoCategoryEmojis
} from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type TabType = 'memories' | 'todos' | 'dates';

export default function MemoriesScreen() {
  const {
    themeColors,
    memories,
    createMemory,
    todos,
    createTodo,
    completeTodo,
    datePlans,
    createDatePlan,
    couple,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('memories');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Memory form state
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDesc, setMemoryDesc] = useState('');
  const [memoryCategory, setMemoryCategory] = useState<MemoryCategory>('diger');
  const [memoryPhotos, setMemoryPhotos] = useState<string[]>([]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<MemoryCategory | 'all'>('all');
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Todo form state
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDesc, setTodoDesc] = useState('');
  const [todoCategory, setTodoCategory] = useState<TodoCategory>('other');

  // Date form state
  const [dateTitle, setDateTitle] = useState('');
  const [dateNotes, setDateNotes] = useState('');
  const [dateLocation, setDateLocation] = useState('');

  // Fotoğraf seç
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyacımız var.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setMemoryPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  // Fotoğraf kaldır
  const removePhoto = (index: number) => {
    setMemoryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Anı ekle
  const handleAddMemory = async () => {
    if (!memoryTitle.trim()) return;

    setIsUploading(true);
    try {
      const customCat = memoryCategory === 'custom' ? customCategoryName : undefined;
      await createMemory(memoryTitle, memoryCategory, new Date(), memoryDesc, undefined, customCat, memoryPhotos);

      // Özel kategoriyi listeye ekle
      if (customCat && !customCategories.includes(customCat)) {
        setCustomCategories(prev => [...prev, customCat]);
      }

      setShowAddMemory(false);
      resetMemoryForm();
    } catch (error) {
      Alert.alert('Hata', 'Anı eklenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetMemoryForm = () => {
    setMemoryTitle('');
    setMemoryDesc('');
    setMemoryCategory('diger');
    setMemoryPhotos([]);
    setCustomCategoryName('');
  };

  const handleAddTodo = async () => {
    if (!todoTitle.trim()) return;
    await createTodo(todoTitle, todoCategory, todoDesc);
    setShowAddTodo(false);
    setTodoTitle('');
    setTodoDesc('');
    setTodoCategory('other');
  };

  const handleCompleteTodo = async (todoId: string) => {
    await completeTodo(todoId);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleAddDate = async () => {
    if (!dateTitle.trim()) return;
    await createDatePlan(dateTitle, new Date(), undefined, dateLocation, dateNotes);
    setShowAddDate(false);
    setDateTitle('');
    setDateNotes('');
    setDateLocation('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ConfettiAnimation visible={showConfetti} />

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: themeColors.surface }]}>
        {(['memories', 'todos', 'dates'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: themeColors.primaryLight },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? themeColors.primaryDark : themeColors.textSecondary },
              ]}
            >
              {tab === 'memories' && '📸 Anılar'}
              {tab === 'todos' && '✅ Yapılacaklar'}
              {tab === 'dates' && '📅 Randevular'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MEMORIES TAB */}
        {activeTab === 'memories' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Anı Kutusu 📸
              </Text>
              <Button
                title="+ Ekle"
                onPress={() => setShowAddMemory(true)}
                size="small"
              />
            </View>

            {/* Filter Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              <TouchableOpacity
                onPress={() => setSelectedFilter('all')}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedFilter === 'all'
                      ? themeColors.primary
                      : themeColors.primaryLight,
                  },
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  { color: selectedFilter === 'all' ? '#FFF' : themeColors.primaryDark }
                ]}>
                  Tümü
                </Text>
              </TouchableOpacity>
              {(Object.keys(MemoryCategoryLabels) as MemoryCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedFilter(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedFilter === cat
                        ? themeColors.primary
                        : themeColors.primaryLight,
                    },
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    { color: selectedFilter === cat ? '#FFF' : themeColors.primaryDark }
                  ]}>
                    {MemoryCategoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Instagram Style Memories List */}
            <View style={styles.instagramFeed}>
              {memories
                .filter(m => selectedFilter === 'all' || m.category === selectedFilter)
                .map((memory, index) => (
                  <Animated.View
                    key={memory.id}
                    entering={FadeInDown.delay(index * 100).duration(400)}
                    style={styles.instagramPost}
                  >
                    {/* Post Header */}
                    <View style={styles.postHeader}>
                      <View style={styles.postCategory}>
                        <Text style={[styles.postCategoryText, { color: themeColors.primary }]}>
                          {memory.category === 'custom' && memory.customCategory
                            ? `🏷️ ${memory.customCategory}`
                            : MemoryCategoryLabels[memory.category]}
                        </Text>
                      </View>
                      <Text style={[styles.postDate, { color: themeColors.textSecondary }]}>
                        {format(new Date(memory.date), 'd MMM yyyy', { locale: tr })}
                      </Text>
                    </View>

                    {/* Post Image Carousel */}
                    <View style={[styles.postImage, { backgroundColor: themeColors.surface }]}>
                      {memory.imageUrl || (memory.imageUrls && memory.imageUrls.length > 0) ? (
                        memory.imageUrls && memory.imageUrls.length > 1 ? (
                          <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.imageCarousel}
                          >
                            {memory.imageUrls.map((imageUri, imgIndex) => (
                              <Image
                                key={imgIndex}
                                source={{ uri: imageUri }}
                                style={styles.carouselImage}
                                resizeMode="cover"
                              />
                            ))}
                          </ScrollView>
                        ) : (
                          <Image
                            source={{ uri: memory.imageUrls?.[0] || memory.imageUrl }}
                            style={styles.postImageContent}
                            resizeMode="cover"
                          />
                        )
                      ) : (
                        <View style={styles.postImagePlaceholder}>
                          <Text style={styles.postImagePlaceholderEmoji}>📸</Text>
                        </View>
                      )}
                      {memory.imageUrls && memory.imageUrls.length > 1 && (
                        <View style={styles.carouselIndicator}>
                          <Text style={styles.carouselIndicatorText}>
                            ◀ {memory.imageUrls.length} fotoğraf ▶
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Post Content */}
                    <View style={styles.postContent}>
                      <Text style={[styles.postTitle, { color: themeColors.text }]}>
                        {memory.title}
                      </Text>
                      {memory.description && (
                        <Text style={[styles.postDescription, { color: themeColors.textSecondary }]}>
                          {memory.description}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
            </View>

            {memories.filter(m => selectedFilter === 'all' || m.category === selectedFilter).length === 0 && (
              <EmptyState
                emoji="📸"
                title={selectedFilter === 'all' ? "Henüz anı yok" : "Bu kategoride anı yok"}
                subtitle="İlk anınızı ekleyin!"
                themeColors={themeColors}
              />
            )}
          </View>
        )}

        {/* TODOS TAB */}
        {activeTab === 'todos' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Birlikte Yapılacaklar ✅
              </Text>
              <Button
                title="+ Ekle"
                onPress={() => setShowAddTodo(true)}
                size="small"
              />
            </View>

            {/* Pending Todos */}
            <Text style={[styles.subTitle, { color: themeColors.text }]}>
              Bekleyenler ({todos.filter(t => !t.isCompleted).length})
            </Text>
            {todos
              .filter((t) => !t.isCompleted)
              .map((todo, index) => (
                <Animated.View
                  key={todo.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <TodoCard
                    todo={todo}
                    themeColors={themeColors}
                    onComplete={() => handleCompleteTodo(todo.id)}
                  />
                </Animated.View>
              ))}

            {/* Completed Todos */}
            {todos.filter(t => t.isCompleted).length > 0 && (
              <>
                <Text style={[styles.subTitle, { color: themeColors.textSecondary }]}>
                  Tamamlananlar 🎉
                </Text>
                {todos
                  .filter((t) => t.isCompleted)
                  .map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      themeColors={themeColors}
                      completed
                    />
                  ))}
              </>
            )}

            {todos.length === 0 && (
              <EmptyState
                emoji="✅"
                title="Liste boş"
                subtitle="Birlikte yapmak istediğiniz şeyleri ekleyin!"
                themeColors={themeColors}
              />
            )}
          </View>
        )}

        {/* DATES TAB */}
        {activeTab === 'dates' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Randevu Planları 📅
              </Text>
              <Button
                title="+ Planla"
                onPress={() => setShowAddDate(true)}
                size="small"
              />
            </View>

            {datePlans.map((plan, index) => (
              <Animated.View
                key={plan.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
                <DateCard plan={plan} themeColors={themeColors} />
              </Animated.View>
            ))}

            {datePlans.length === 0 && (
              <EmptyState
                emoji="📅"
                title="Randevu yok"
                subtitle="Birlikte bir plan yapın!"
                themeColors={themeColors}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* ADD MEMORY MODAL */}
      <Modal
        visible={showAddMemory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMemory(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowAddMemory(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Yeni Anı 📸</Text>
            <TouchableOpacity onPress={handleAddMemory}>
              <Text style={[styles.modalSave, { color: themeColors.primary }]}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              value={memoryTitle}
              onChangeText={setMemoryTitle}
              placeholder="Anı başlığı..."
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
            <TextInput
              value={memoryDesc}
              onChangeText={setMemoryDesc}
              placeholder="Açıklama (opsiyonel)..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              style={[styles.input, styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
            <Text style={[styles.label, { color: themeColors.text }]}>Kategori</Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(MemoryCategoryLabels) as MemoryCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setMemoryCategory(cat)}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: memoryCategory === cat ? themeColors.primary : themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      { color: memoryCategory === cat ? '#FFF' : themeColors.text },
                    ]}
                  >
                    {MemoryCategoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Özel Kategori Input */}
            {memoryCategory === 'custom' && (
              <TextInput
                value={customCategoryName}
                onChangeText={setCustomCategoryName}
                placeholder="Kategori adı yazın..."
                placeholderTextColor={themeColors.textSecondary}
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, marginTop: Spacing.sm }]}
              />
            )}

            {/* Fotoğraf Ekleme */}
            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.md }]}>
              Fotoğraflar (max 5)
            </Text>
            <View style={styles.photoGrid}>
              {memoryPhotos.map((uri, index) => (
                <View key={index} style={styles.photoPreviewContainer}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={styles.photoRemoveButton}
                  >
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {memoryPhotos.length < 5 && (
                <TouchableOpacity
                  onPress={pickImage}
                  style={[styles.photoAddButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                >
                  <Text style={styles.photoAddText}>📷+</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Yükleniyor */}
            {isUploading && (
              <View style={styles.uploadingContainer}>
                <Text style={[styles.uploadingText, { color: themeColors.primary }]}>
                  Anı kaydediliyor...
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ADD TODO MODAL */}
      <Modal
        visible={showAddTodo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTodo(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowAddTodo(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Yeni Görev ✅</Text>
            <TouchableOpacity onPress={handleAddTodo}>
              <Text style={[styles.modalSave, { color: themeColors.primary }]}>Ekle</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              value={todoTitle}
              onChangeText={setTodoTitle}
              placeholder="Ne yapmak istiyorsunuz?"
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
            <TextInput
              value={todoDesc}
              onChangeText={setTodoDesc}
              placeholder="Detay (opsiyonel)..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              style={[styles.input, styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
            <Text style={[styles.label, { color: themeColors.text }]}>Kategori</Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(TodoCategoryEmojis) as TodoCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setTodoCategory(cat)}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: todoCategory === cat ? themeColors.primary : themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      { color: todoCategory === cat ? '#FFF' : themeColors.text },
                    ]}
                  >
                    {TodoCategoryEmojis[cat]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ADD DATE MODAL */}
      <Modal
        visible={showAddDate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddDate(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowAddDate(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Randevu Planla 📅</Text>
            <TouchableOpacity onPress={handleAddDate}>
              <Text style={[styles.modalSave, { color: themeColors.primary }]}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              value={dateTitle}
              onChangeText={setDateTitle}
              placeholder="Randevu başlığı..."
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
            <TextInput
              value={dateLocation}
              onChangeText={setDateLocation}
              placeholder="📍 Konum (opsiyonel)..."
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
            <TextInput
              value={dateNotes}
              onChangeText={setDateNotes}
              placeholder="Notlar (opsiyonel)..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              style={[styles.input, styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// SUB COMPONENTS

function TodoCard({
  todo,
  themeColors,
  onComplete,
  completed = false,
}: {
  todo: CoupleTodo;
  themeColors: any;
  onComplete?: () => void;
  completed?: boolean;
}) {
  return (
    <Card
      style={{
        ...styles.todoCard,
        ...(completed ? { opacity: 0.6 } : {}),
      }}
    >
      <TouchableOpacity
        onPress={onComplete}
        disabled={completed}
        style={[
          styles.todoCheckbox,
          {
            backgroundColor: completed ? themeColors.success : themeColors.background,
            borderColor: completed ? themeColors.success : themeColors.border,
          },
        ]}
      >
        {completed && <Text style={styles.todoCheck}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.todoContent}>
        <View style={styles.todoHeader}>
          <Text style={styles.todoEmoji}>{TodoCategoryEmojis[todo.category]}</Text>
          <Text
            style={[
              styles.todoTitle,
              { color: themeColors.text },
              completed && styles.todoTitleCompleted,
            ]}
          >
            {todo.title}
          </Text>
        </View>
        {todo.description && (
          <Text style={[styles.todoDesc, { color: themeColors.textSecondary }]}>
            {todo.description}
          </Text>
        )}
      </View>
    </Card>
  );
}

function DateCard({ plan, themeColors }: { plan: DatePlan; themeColors: any }) {
  return (
    <Card style={styles.dateCard}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateEmoji}>💑</Text>
        <View>
          <Text style={[styles.dateTitle, { color: themeColors.text }]}>
            {plan.title}
          </Text>
          <Text style={[styles.dateTime, { color: themeColors.textSecondary }]}>
            {format(new Date(plan.date), 'd MMMM yyyy', { locale: tr })}
            {plan.time && ` • ${plan.time}`}
          </Text>
        </View>
      </View>
      {plan.location && (
        <Text style={[styles.dateLocation, { color: themeColors.primary }]}>
          📍 {plan.location}
        </Text>
      )}
      {plan.notes && (
        <Text style={[styles.dateNotes, { color: themeColors.textSecondary }]}>
          {plan.notes}
        </Text>
      )}
    </Card>
  );
}

function EmptyState({
  emoji,
  title,
  subtitle,
  themeColors,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  themeColors: any;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  subTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  categoriesScroll: {
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: FontSizes.sm,
  },
  // Instagram Style Memories
  instagramFeed: {
    gap: Spacing.lg,
  },
  instagramPost: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  postCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postCategoryText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  postDate: {
    fontSize: FontSizes.xs,
  },
  postImage: {
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  imageCarousel: {
    width: '100%',
    height: '100%',
  },
  carouselImage: {
    width: 350,
    height: 350,
    marginRight: 0,
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: Spacing.sm,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  carouselIndicatorText: {
    color: '#FFF',
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  postImageContent: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImagePlaceholderEmoji: {
    fontSize: 60,
    opacity: 0.5,
  },
  multiplePhotosIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  multiplePhotosText: {
    color: '#FFF',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  postContent: {
    paddingVertical: Spacing.sm,
  },
  postTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  postDescription: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  // Old Grid (keep for backwards compatibility)
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memoryCardWrapper: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  memoryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  memoryImagePlaceholder: {
    height: 120,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryPlaceholderEmoji: {
    fontSize: 40,
  },
  memoryTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    padding: Spacing.sm,
    paddingBottom: 0,
  },
  memoryDate: {
    fontSize: FontSizes.xs,
    padding: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  todoCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  todoCheck: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoEmoji: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  todoTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  todoDesc: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    marginLeft: 26,
  },
  dateCard: {
    marginBottom: Spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  dateTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  dateTime: {
    fontSize: FontSizes.sm,
  },
  dateLocation: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  dateNotes: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: FontSizes.md,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.md,
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryOptionText: {
    fontSize: FontSizes.sm,
  },
  // Photo Styles
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoAddButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: {
    fontSize: 24,
  },
  uploadingContainer: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
});