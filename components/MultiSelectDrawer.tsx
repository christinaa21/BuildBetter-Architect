// components/MultiSelectDrawer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '@/app/theme';
import Button from './Button';
import Textfield from './Textfield';

interface MultiSelectDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValues: string[];
  onApply: (newSelectedValues: string[]) => void;
  enableSearch?: boolean; // Optional prop to enable/disable search
  searchPlaceholder?: string; // Optional custom search placeholder
}

export default function MultiSelectDrawer({
  isVisible,
  onClose,
  title,
  options,
  selectedValues,
  onApply,
  enableSearch = false,
  searchPlaceholder = "Cari...",
}: MultiSelectDrawerProps) {
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>(selectedValues);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Sync with external changes if the modal is re-opened
    if (isVisible) {
      setTempSelectedValues(selectedValues);
      setSearchQuery(''); // Reset search when modal opens
    }
  }, [selectedValues, isVisible]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!enableSearch || searchQuery.trim() === '') {
      return options;
    }
    return options.filter(option => 
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, enableSearch]);

  const handleToggleOption = (option: string) => {
    setTempSelectedValues(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const handleClear = () => {
    setTempSelectedValues([]);
  };

  const handleApply = () => {
    onApply(tempSelectedValues);
    onClose();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.optionItem} onPress={() => handleToggleOption(item)}>
      <Text style={styles.optionText}>{item}</Text>
      <View style={[styles.checkboxBase, tempSelectedValues.includes(item) && styles.checkboxChecked]}>
        {tempSelectedValues.includes(item) && <Text style={styles.checkboxCheckmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={48} color={theme.colors.customGray[100]} />
      <Text style={styles.emptyText}>Tidak ada hasil yang sesuai dengan pencarian.</Text>
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <SafeAreaView style={styles.safeAreaContainer} edges={['bottom']}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={handleClear}>
                <Text style={styles.clearButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            {enableSearch && (
              <View style={styles.searchContainer}>
                <Textfield
                  icon={<MaterialIcons name="search" size={16} />}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  paddingVertical={10}
                  borderRadius={100}
                />
              </View>
            )}

            {/* Options List */}
            <View style={styles.listContainer}>
              <FlatList
                data={filteredOptions}
                renderItem={renderItem}
                keyExtractor={(item) => item}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                style={styles.list}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={enableSearch ? renderEmptyList : null}
                keyboardShouldPersistTaps="handled"
              />
            </View>

            {/* Fixed Bottom Button */}
            <View style={styles.buttonContainer}>
              <Button
                title="Set filter"
                variant="primary"
                onPress={handleApply}
                minHeight={44}
                paddingVertical={10}
              />
            </View>
            
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  safeAreaContainer: {
    backgroundColor: theme.colors.customWhite[50],
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%', // Increased to accommodate search bar
    minHeight: '64%', // Ensure minimum height
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.customOlive[50],
  },
  clearButtonText: {
    ...theme.typography.body2,
    color: theme.colors.customGreen[300],
  },
  searchContainer: {
    marginBottom: 4,
    marginTop: -8,
  },
  listContainer: {
    flex: 1, // Take remaining space above button
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    ...theme.typography.body1,
    color: theme.colors.customOlive[50],
    flex: 1,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.customGreen[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.customGreen[300],
  },
  checkboxCheckmark: {
    color: theme.colors.customWhite[50],
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.customGray[50],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...theme.typography.body2,
    color: theme.colors.customGray[200],
    textAlign: 'center',
    marginTop: 12,
  },
  buttonContainer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 5 : 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.customGray[50],
    backgroundColor: theme.colors.customWhite[50], // Ensure button area has background
  },
});