import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  contractorApi,
  type ContractorAvailability,
  type ContractorBreak,
  type ContractorException,
} from '../../services/api';

export const ContractorAvailabilityScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<ContractorAvailability[]>([]);
  const [breaks, setBreaks] = useState<ContractorBreak[]>([]);
  const [exceptions, setExceptions] = useState<ContractorException[]>([]);

  const [selectedTab, setSelectedTab] = useState<'schedule' | 'details'>('schedule');
  const [showAddBreakModal, setShowAddBreakModal] = useState(false);
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false);

  const [newBreak, setNewBreak] = useState({
    day_of_week: 0,
    start_time: '',
    end_time: '',
  });

  const [newException, setNewException] = useState({
    exception_date: '',
    is_available: false,
    start_time: '',
    end_time: '',
    reason: '',
  });

  const days = [
    { label: language === 'fr' ? 'Lun' : 'Mon', value: 0 },
    { label: language === 'fr' ? 'Mar' : 'Tue', value: 1 },
    { label: language === 'fr' ? 'Mer' : 'Wed', value: 2 },
    { label: language === 'fr' ? 'Jeu' : 'Thu', value: 3 },
    { label: language === 'fr' ? 'Ven' : 'Fri', value: 4 },
    { label: language === 'fr' ? 'Sam' : 'Sat', value: 5 },
    { label: language === 'fr' ? 'Dim' : 'Sun', value: 6 },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await contractorApi.getProfileByUserId(user?.id || '');
      if (!profile) return;

      setContractorId(profile.id);

      const [availData, breaksData, exceptionsData] = await Promise.all([
        contractorApi.getAvailability(profile.id),
        contractorApi.getBreaks(profile.id),
        contractorApi.getExceptions(profile.id),
      ]);

      setAvailability(availData);
      setBreaks(breaksData);
      setExceptions(exceptionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPlan = async () => {
    Alert.alert(
      language === 'fr' ? 'Réinitialiser' : 'Reset Plan',
      language === 'fr'
        ? 'Voulez-vous réinitialiser votre planning (Lun-Ven 9h-17h)?'
        : 'Do you want to reset to default schedule (Mon-Fri 9am-5pm)?',
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Confirmer' : 'Confirm',
          onPress: async () => {
            if (!contractorId) return;
            try {
              await contractorApi.resetAvailability(contractorId);
              loadData();
            } catch (error) {
              console.error('Error resetting plan:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleDay = async (dayOfWeek: number, currentlyWorking: boolean) => {
    if (!contractorId) return;

    try {
      await contractorApi.updateAvailability(contractorId, dayOfWeek, {
        is_working: !currentlyWorking,
      });
      loadData();
    } catch (error) {
      console.error('Error toggling day:', error);
    }
  };

  const handleUpdateTime = async (
    dayOfWeek: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    if (!contractorId) return;

    try {
      await contractorApi.updateAvailability(contractorId, dayOfWeek, {
        [field]: value,
      });
      loadData();
    } catch (error) {
      console.error('Error updating time:', error);
    }
  };

  const handleAddBreak = async () => {
    if (!contractorId) return;
    if (!newBreak.start_time || !newBreak.end_time) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await contractorApi.addBreak({
        contractor_id: contractorId,
        ...newBreak,
      });
      setShowAddBreakModal(false);
      setNewBreak({ day_of_week: 0, start_time: '', end_time: '' });
      loadData();
    } catch (error) {
      console.error('Error adding break:', error);
      Alert.alert('Error', 'Failed to add break');
    }
  };

  const handleDeleteBreak = async (breakId: string) => {
    Alert.alert(
      language === 'fr' ? 'Supprimer' : 'Delete',
      language === 'fr' ? 'Supprimer cette pause?' : 'Delete this break?',
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contractorApi.deleteBreak(breakId);
              loadData();
            } catch (error) {
              console.error('Error deleting break:', error);
            }
          },
        },
      ]
    );
  };

  const handleAddException = async () => {
    if (!contractorId) return;
    if (!newException.exception_date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    try {
      await contractorApi.addException({
        contractor_id: contractorId,
        ...newException,
      });
      setShowAddExceptionModal(false);
      setNewException({
        exception_date: '',
        is_available: false,
        start_time: '',
        end_time: '',
        reason: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding exception:', error);
      Alert.alert('Error', 'Failed to add exception');
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    Alert.alert(
      language === 'fr' ? 'Supprimer' : 'Delete',
      language === 'fr' ? 'Supprimer cette exception?' : 'Delete this exception?',
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contractorApi.deleteException(exceptionId);
              loadData();
            } catch (error) {
              console.error('Error deleting exception:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>My Schedule</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { padding: spacing(2.5) }]}>
        <TouchableOpacity
          style={[styles.tab, { padding: spacing(1.5) }]}
          onPress={() => setShowAddExceptionModal(true)}
        >
          <Text style={[styles.tabText, { fontSize: normalizeFontSize(14) }]}>+ Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, { padding: spacing(1.5) }]}>
          <Text style={[styles.tabText, { fontSize: normalizeFontSize(14) }]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabActive, { padding: spacing(1.5) }]}
          onPress={() => setSelectedTab('schedule')}
        >
          <Text style={[styles.tabText, styles.tabTextActive, { fontSize: normalizeFontSize(14) }]}>
            📅 My Schedule
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Working Plan */}
        <View style={[styles.section, { padding: spacing(2.5) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
            Working Plan
          </Text>

          <TouchableOpacity
            style={[styles.resetButton, { padding: spacing(1.5), marginTop: spacing(2) }]}
            onPress={handleResetPlan}
          >
            <Text style={[styles.resetButtonText, { fontSize: normalizeFontSize(14) }]}>
              🔄 Reset Plan
            </Text>
          </TouchableOpacity>

          {/* Days table */}
          <View style={[styles.table, { marginTop: spacing(2) }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { fontSize: normalizeFontSize(13), flex: 1 }]}>
                Day
              </Text>
              <Text style={[styles.tableHeaderText, { fontSize: normalizeFontSize(13), flex: 1 }]}>
                Starts
              </Text>
              <Text style={[styles.tableHeaderText, { fontSize: normalizeFontSize(13), flex: 1 }]}>
                End
              </Text>
            </View>

            {days.map((day) => {
              const dayAvail = availability.find((a) => a.day_of_week === day.value);
              const isWorking = dayAvail?.is_working ?? false;

              return (
                <View key={day.value} style={[styles.tableRow, { padding: spacing(1.5) }]}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => handleToggleDay(day.value, isWorking)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { fontSize: normalizeFontSize(14) },
                        !isWorking && styles.dayTextDisabled,
                      ]}
                    >
                      {isWorking ? '✓' : '✕'} {day.label}
                    </Text>
                  </TouchableOpacity>

                  {isWorking ? (
                    <>
                      <TextInput
                        style={[styles.timeInput, { fontSize: normalizeFontSize(14), flex: 1 }]}
                        value={dayAvail?.start_time || ''}
                        onChangeText={(text) => handleUpdateTime(day.value, 'start_time', text)}
                        placeholder="09:00"
                      />
                      <TextInput
                        style={[styles.timeInput, { fontSize: normalizeFontSize(14), flex: 1 }]}
                        value={dayAvail?.end_time || ''}
                        onChangeText={(text) => handleUpdateTime(day.value, 'end_time', text)}
                        placeholder="17:00"
                      />
                    </>
                  ) : (
                    <>
                      <View style={{ flex: 1 }} />
                      <View style={{ flex: 1 }} />
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Breaks */}
        <View style={[styles.section, { padding: spacing(2.5), marginTop: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>Breaks</Text>
          <Text style={[styles.sectionDescription, { fontSize: normalizeFontSize(13), marginTop: spacing(1) }]}>
            Add the working breaks during each day. During breaks the provider will not accept any
            appointments.
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { padding: spacing(1.5), marginTop: spacing(2) }]}
            onPress={() => setShowAddBreakModal(true)}
          >
            <Text style={[styles.addButtonText, { fontSize: normalizeFontSize(14) }]}>
              + Add Breaks
            </Text>
          </TouchableOpacity>

          {/* Breaks list */}
          {breaks.length > 0 && (
            <View style={[styles.table, { marginTop: spacing(2) }]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { fontSize: normalizeFontSize(13), flex: 1 }]}>
                  Day
                </Text>
                <Text style={[styles.tableHeaderText, { fontSize: normalizeFontSize(13), flex: 1 }]}>
                  Starts
                </Text>
                <Text style={[styles.tableHeaderText, { fontSize: normalizeFontSize(13), flex: 1 }]}>
                  End
                </Text>
              </View>

              {breaks.map((breakItem) => (
                <TouchableOpacity
                  key={breakItem.id}
                  style={[styles.tableRow, { padding: spacing(1.5) }]}
                  onLongPress={() => handleDeleteBreak(breakItem.id)}
                >
                  <Text style={[styles.dayText, { fontSize: normalizeFontSize(14), flex: 1 }]}>
                    {days[breakItem.day_of_week]?.label}
                  </Text>
                  <Text style={[styles.timeText, { fontSize: normalizeFontSize(14), flex: 1 }]}>
                    {breakItem.start_time}
                  </Text>
                  <Text style={[styles.timeText, { fontSize: normalizeFontSize(14), flex: 1 }]}>
                    {breakItem.end_time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Exceptions */}
        <View style={[styles.section, { padding: spacing(2.5), marginTop: spacing(3), marginBottom: spacing(10) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
            Add Working Plan Exception
          </Text>
          <Text style={[styles.sectionDescription, { fontSize: normalizeFontSize(13), marginTop: spacing(1) }]}>
            Add the working breaks during each day. During breaks the provider will not accept any
            appointments.
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { padding: spacing(1.5), marginTop: spacing(2) }]}
            onPress={() => setShowAddExceptionModal(true)}
          >
            <Text style={[styles.addButtonText, { fontSize: normalizeFontSize(14) }]}>
              + Add Working Plan Exception
            </Text>
          </TouchableOpacity>

          {/* Exceptions list */}
          {exceptions.length > 0 && (
            <View style={{ marginTop: spacing(2) }}>
              {exceptions.map((exception) => (
                <TouchableOpacity
                  key={exception.id}
                  style={[styles.exceptionCard, { padding: spacing(2), marginBottom: spacing(1.5) }]}
                  onLongPress={() => handleDeleteException(exception.id)}
                >
                  <Text style={[styles.exceptionDate, { fontSize: normalizeFontSize(14) }]}>
                    📅 {exception.exception_date}
                  </Text>
                  <Text style={[styles.exceptionStatus, { fontSize: normalizeFontSize(13) }]}>
                    {exception.is_available ? '✅ Available' : '🚫 Not Available'}
                  </Text>
                  {exception.is_available && (
                    <Text style={[styles.exceptionTime, { fontSize: normalizeFontSize(13) }]}>
                      ⏰ {exception.start_time} - {exception.end_time}
                    </Text>
                  )}
                  {exception.reason && (
                    <Text style={[styles.exceptionReason, { fontSize: normalizeFontSize(12) }]}>
                      {exception.reason}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Break Modal */}
      <Modal visible={showAddBreakModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: spacing(3) }]}>
            <Text style={[styles.modalTitle, { fontSize: normalizeFontSize(18) }]}>Add Break</Text>

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Day
            </Text>
            <View style={styles.dayPicker}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayPickerButton,
                    { padding: spacing(1) },
                    newBreak.day_of_week === day.value && styles.dayPickerButtonActive,
                  ]}
                  onPress={() => setNewBreak({ ...newBreak, day_of_week: day.value })}
                >
                  <Text
                    style={[
                      styles.dayPickerText,
                      { fontSize: normalizeFontSize(12) },
                      newBreak.day_of_week === day.value && styles.dayPickerTextActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Start Time
            </Text>
            <TextInput
              style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
              value={newBreak.start_time}
              onChangeText={(text) => setNewBreak({ ...newBreak, start_time: text })}
              placeholder="12:00"
            />

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              End Time
            </Text>
            <TextInput
              style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
              value={newBreak.end_time}
              onChangeText={(text) => setNewBreak({ ...newBreak, end_time: text })}
              placeholder="13:00"
            />

            <View style={[styles.modalButtons, { marginTop: spacing(3) }]}>
              <TouchableOpacity
                style={[styles.modalButton, { padding: spacing(1.5), flex: 1, marginRight: spacing(1) }]}
                onPress={() => setShowAddBreakModal(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: normalizeFontSize(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { padding: spacing(1.5), flex: 1, marginLeft: spacing(1) },
                ]}
                onPress={handleAddBreak}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                    { fontSize: normalizeFontSize(14) },
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Exception Modal */}
      <Modal visible={showAddExceptionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: spacing(3) }]}>
            <Text style={[styles.modalTitle, { fontSize: normalizeFontSize(18) }]}>
              Add Exception
            </Text>

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
              value={newException.exception_date}
              onChangeText={(text) => setNewException({ ...newException, exception_date: text })}
              placeholder="2024-12-25"
            />

            <TouchableOpacity
              style={[styles.checkboxRow, { marginTop: spacing(2) }]}
              onPress={() =>
                setNewException({ ...newException, is_available: !newException.is_available })
              }
            >
              <View style={styles.checkbox}>
                {newException.is_available && <Text style={{ fontSize: normalizeFontSize(14) }}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                I'm available on this day
              </Text>
            </TouchableOpacity>

            {newException.is_available && (
              <>
                <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                  Start Time
                </Text>
                <TextInput
                  style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                  value={newException.start_time}
                  onChangeText={(text) => setNewException({ ...newException, start_time: text })}
                  placeholder="09:00"
                />

                <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                  End Time
                </Text>
                <TextInput
                  style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                  value={newException.end_time}
                  onChangeText={(text) => setNewException({ ...newException, end_time: text })}
                  placeholder="17:00"
                />
              </>
            )}

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Reason (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { padding: spacing(1.5), fontSize: normalizeFontSize(14) },
              ]}
              value={newException.reason}
              onChangeText={(text) => setNewException({ ...newException, reason: text })}
              placeholder="Vacation, Holiday, etc."
              multiline
              numberOfLines={3}
            />

            <View style={[styles.modalButtons, { marginTop: spacing(3) }]}>
              <TouchableOpacity
                style={[styles.modalButton, { padding: spacing(1.5), flex: 1, marginRight: spacing(1) }]}
                onPress={() => setShowAddExceptionModal(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: normalizeFontSize(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { padding: spacing(1.5), flex: 1, marginLeft: spacing(1) },
                ]}
                onPress={handleAddException}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                    { fontSize: normalizeFontSize(14) },
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },
  title: {
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF',
  },
  tab: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  tabActive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  tabText: {
    color: '#666',
  },
  tabTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  sectionDescription: {
    color: '#666',
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  resetButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 12,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  dayText: {
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: '#999',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#FFF',
    marginHorizontal: 5,
  },
  timeText: {
    color: '#666',
  },
  exceptionCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exceptionDate: {
    fontWeight: '600',
  },
  exceptionStatus: {
    marginTop: 5,
    color: '#666',
  },
  exceptionTime: {
    marginTop: 5,
    color: '#666',
  },
  exceptionReason: {
    marginTop: 5,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dayPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayPickerButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    minWidth: 45,
    alignItems: 'center',
  },
  dayPickerButtonActive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  dayPickerText: {
    color: '#666',
  },
  dayPickerTextActive: {
    color: '#FFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  modalButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
  },
});
