import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useI18n } from '../i18n/I18nContext';
import { formatCurrency, type CountryCode } from '../utils/currency';
import { servicesApi, therapistsApi, salonsApi, bookingsApi } from '../services/api';
import type { Booking, Service } from '../services/api';

interface RebookModalProps {
    visible: boolean;
    booking: Booking | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const RebookModal: React.FC<RebookModalProps> = ({
    visible,
    booking,
    onClose,
    onSuccess,
}) => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { language } = useI18n();
    const [countryCode] = useState<CountryCode>('CM');

    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Generate available dates (next 7 days)
    const availableDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    // Load provider services when modal opens
    useEffect(() => {
        if (visible && booking) {
            loadProviderServices();
            // Pre-select services from the booking
            preselectServices();
        } else {
            // Reset state when modal closes
            setSelectedServiceIds([]);
            setSelectedDate(null);
            setSelectedTime(null);
            setAvailableTimes([]);
        }
    }, [visible, booking]);

    // Load availability when date is selected
    useEffect(() => {
        if (selectedDate && booking) {
            loadAvailability();
        } else {
            setAvailableTimes([]);
            setSelectedTime(null);
        }
    }, [selectedDate, booking]);

    const preselectServices = async () => {
        if (!booking?.items) return;

        try {
            // Fetch all services to match by name
            const allServices = await servicesApi.getAll();
            const serviceIds: string[] = [];

            for (const item of booking.items) {
                // Find service by name (name_fr or name_en)
                const matchedService = allServices.find(
                    (s: Service) => s.name_fr === item.service_name || s.name_en === item.service_name
                );
                if (matchedService) {
                    serviceIds.push(matchedService.id);
                }
            }

            setSelectedServiceIds(serviceIds);
        } catch (error) {
            console.error('Error preselecting services:', error);
        }
    };

    const loadProviderServices = async () => {
        if (!booking) return;

        try {
            setLoadingServices(true);
            let services: Service[] = [];

            if (booking.therapist_id) {
                // Use the therapist services API endpoint
                const therapistServices = await therapistsApi.getServices(booking.therapist_id);
                // Extract the nested service objects and merge with therapist-specific pricing
                services = therapistServices.map((ts) => ({
                    ...ts.service,
                    base_price: ts.price, // Use therapist's specific price
                    duration: ts.duration, // Use therapist's specific duration
                }));
            } else if (booking.salon_id) {
                // Use the salon services API endpoint
                const salonServices = await salonsApi.getServices(booking.salon_id);
                // Extract the nested service objects and merge with salon-specific pricing
                services = salonServices.map((ss) => ({
                    ...ss.service,
                    base_price: ss.price, // Use salon's specific price
                    duration: ss.duration, // Use salon's specific duration
                }));
            }

            console.log('📋 Loaded services:', services.length, services);
            setAvailableServices(services);
        } catch (error) {
            console.error('Error loading provider services:', error);
            Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                language === 'fr'
                    ? 'Impossible de charger les services'
                    : 'Failed to load services'
            );
        } finally {
            setLoadingServices(false);
        }
    };

    const loadAvailability = async () => {
        if (!selectedDate || !booking) return;

        try {
            setLoadingAvailability(true);
            const dateStr = selectedDate.toISOString().split('T')[0];

            let times: string[] = [];
            try {
                if (booking.therapist_id) {
                    times = await therapistsApi.getAvailability(booking.therapist_id, dateStr);
                } else if (booking.salon_id) {
                    times = await salonsApi.getAvailability(booking.salon_id, dateStr);
                }
            } catch (apiError) {
                console.warn('Failed to fetch availability, using default slots:', apiError);
            }

            // Fallback to default slots if no times returned
            if (!times || times.length === 0) {
                const defaultSlots = [];
                for (let i = 8; i <= 20; i++) {
                    defaultSlots.push(`${i.toString().padStart(2, '0')}:00`);
                }
                times = defaultSlots;
            }

            setAvailableTimes(times);
        } catch (error) {
            console.error('Error loading availability:', error);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const toggleService = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const calculateTotal = () => {
        const selectedServices = availableServices.filter((s) =>
            selectedServiceIds.includes(s.id)
        );
        const subtotal = selectedServices.reduce((sum, s) => sum + (s.base_price || 0), 0);
        const travelFee = booking?.travel_fee || 0;
        return subtotal + travelFee;
    };

    const handleRebook = async () => {
        if (!booking || !selectedDate || !selectedTime || selectedServiceIds.length === 0) {
            Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                language === 'fr'
                    ? 'Veuillez sélectionner une date, une heure et au moins un service'
                    : 'Please select a date, time, and at least one service'
            );
            return;
        }

        try {
            setLoading(true);

            // Prepare booking data
            const selectedServices = availableServices.filter((s) =>
                selectedServiceIds.includes(s.id)
            );

            const scheduledAt = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':');
            scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const bookingData = {
                user_id: booking.user_id,
                therapist_id: booking.therapist_id || undefined,
                salon_id: booking.salon_id || undefined,
                scheduled_at: scheduledAt.toISOString(),
                duration: selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0),
                location_type: booking.location_type,
                quarter: booking.quarter,
                street: booking.street,
                landmark: booking.landmark,
                city: booking.city,
                region: booking.region,
                latitude: booking.latitude,
                longitude: booking.longitude,
                instructions: booking.instructions,
                subtotal: selectedServices.reduce((sum, s) => sum + (s.base_price || 0), 0),
                travel_fee: booking.travel_fee || 0,
                tip: 0,
                total: calculateTotal(),
                notes: language === 'fr' ? 'Réservation répétée' : 'Repeat booking',
                items: selectedServices.map((s) => ({
                    service_name: language === 'fr' ? s.name_fr : s.name_en,
                    price: s.base_price || 0,
                    duration: s.duration || 0,
                })),
            };

            await bookingsApi.create(bookingData);

            Alert.alert(
                language === 'fr' ? 'Succès' : 'Success',
                language === 'fr'
                    ? 'Votre réservation a été créée avec succès'
                    : 'Your booking has been created successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            onSuccess();
                            onClose();
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error creating booking:', error);
            Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                language === 'fr'
                    ? 'Impossible de créer la réservation'
                    : 'Failed to create booking'
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'short',
        });
        const weekday = date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            weekday: 'short',
        });
        return { day, month, weekday };
    };

    const formatDateShort = (date: Date) => {
        return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'short',
        });
    };

    if (!booking) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { borderTopLeftRadius: spacing(3), borderTopRightRadius: spacing(3), paddingTop: spacing(3) }]}>
                    {/* Header */}
                    <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(2), marginBottom: spacing(2) }]}>
                        <Text style={[styles.title, { fontSize: normalizeFontSize(20) }]}>
                            {language === 'fr' ? 'Recommander' : 'Re-book'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { padding: spacing(1) }]}>
                            <Text style={[styles.closeButtonText, { fontSize: normalizeFontSize(24) }]}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Date Selection */}
                        <View style={[styles.section, { marginBottom: spacing(3) }]}>
                            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
                                {language === 'fr' ? 'Sélectionner une date' : 'Select a date'}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {availableDates.map((date) => {
                                    const { day, month, weekday } = formatDate(date);
                                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    return (
                                        <TouchableOpacity
                                            key={date.toISOString()}
                                            style={[
                                                styles.dateCard,
                                                { padding: spacing(1.5), marginRight: spacing(1.5), borderRadius: spacing(1.5), minWidth: spacing(9), borderWidth: 2, borderColor: 'transparent' },
                                                isSelected && styles.selectedDateCard,
                                                isToday && !isSelected && { borderColor: '#2D2D2D' },
                                            ]}
                                            onPress={() => setSelectedDate(date)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.dateWeekday,
                                                    { fontSize: normalizeFontSize(11), marginBottom: spacing(0.5) },
                                                    isSelected && styles.selectedDateText,
                                                ]}
                                            >
                                                {weekday}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.dateDay,
                                                    { fontSize: normalizeFontSize(20), marginBottom: spacing(0.25) },
                                                    isSelected && styles.selectedDateText,
                                                ]}
                                            >
                                                {day}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.dateMonth,
                                                    { fontSize: normalizeFontSize(10) },
                                                    isSelected && styles.selectedDateText,
                                                ]}
                                            >
                                                {month}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Time Selection */}
                        {selectedDate && (
                            <View style={[styles.section, { marginBottom: spacing(3) }]}>
                                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
                                    {language === 'fr' ? 'Sélectionner une heure' : 'Select a time'}
                                </Text>
                                {loadingAvailability ? (
                                    <ActivityIndicator size="small" color="#2D2D2D" />
                                ) : (
                                    <View style={styles.timeGrid}>
                                        {availableTimes.map((time) => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeSlot,
                                                    { padding: spacing(1.5), marginRight: spacing(1), marginBottom: spacing(1), borderRadius: spacing(1), minWidth: spacing(10) },
                                                    selectedTime === time && styles.selectedTimeSlot,
                                                ]}
                                                onPress={() => setSelectedTime(time)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.timeText,
                                                        { fontSize: normalizeFontSize(14) },
                                                        selectedTime === time && styles.selectedTimeText,
                                                    ]}
                                                >
                                                    {time}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Services Selection */}
                        <View style={[styles.section, { marginBottom: spacing(3) }]}>
                            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
                                {language === 'fr' ? 'Services' : 'Services'}
                            </Text>
                            {loadingServices ? (
                                <ActivityIndicator size="small" color="#2D2D2D" />
                            ) : (
                                availableServices.map((service) => (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={[
                                            styles.serviceCard,
                                            { padding: spacing(2), marginBottom: spacing(1.5), borderRadius: spacing(1.5) },
                                            selectedServiceIds.includes(service.id) && styles.selectedServiceCard,
                                        ]}
                                        onPress={() => toggleService(service.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.serviceInfo}>
                                            <Text
                                                style={[
                                                    styles.serviceName,
                                                    { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5) },
                                                    selectedServiceIds.includes(service.id) && styles.selectedServiceName,
                                                ]}
                                            >
                                                {language === 'fr' ? service.name_fr : service.name_en}
                                            </Text>
                                            <Text style={[styles.serviceDetails, { fontSize: normalizeFontSize(12) }]}>
                                                {formatCurrency(service.base_price || 0, countryCode)} • {service.duration} min
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.checkbox,
                                                { width: spacing(3), height: spacing(3), borderRadius: spacing(0.5) },
                                                selectedServiceIds.includes(service.id) && styles.checkedCheckbox,
                                            ]}
                                        >
                                            {selectedServiceIds.includes(service.id) && (
                                                <Text style={[styles.checkmark, { fontSize: normalizeFontSize(14) }]}>✓</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        {/* Summary */}
                        {selectedServiceIds.length > 0 && (
                            <View style={[styles.summary, { padding: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(2) }]}>
                                <Text style={[styles.summaryTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
                                    {language === 'fr' ? 'Récapitulatif' : 'Summary'}
                                </Text>
                                <View style={[styles.summaryRow, { marginBottom: spacing(1) }]}>
                                    <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(14) }]}>
                                        {language === 'fr' ? 'Services' : 'Services'}
                                    </Text>
                                    <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(14) }]}>
                                        {selectedServiceIds.length}
                                    </Text>
                                </View>
                                {selectedDate && selectedTime && (
                                    <View style={[styles.summaryRow, { marginBottom: spacing(1) }]}>
                                        <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(14) }]}>
                                            {language === 'fr' ? 'Date & Heure' : 'Date & Time'}
                                        </Text>
                                        <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(14) }]}>
                                            {formatDateShort(selectedDate)} {selectedTime}
                                        </Text>
                                    </View>
                                )}
                                <View style={[styles.summaryDivider, { marginVertical: spacing(1.5) }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryTotal, { fontSize: normalizeFontSize(16) }]}>
                                        {language === 'fr' ? 'Total' : 'Total'}
                                    </Text>
                                    <Text style={[styles.summaryTotal, { fontSize: normalizeFontSize(16) }]}>
                                        {formatCurrency(calculateTotal(), countryCode)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { padding: spacing(2.5) }]}>
                        <TouchableOpacity
                            style={[
                                styles.rebookButton,
                                { paddingVertical: spacing(2), borderRadius: spacing(1.5) },
                                (!selectedDate || !selectedTime || selectedServiceIds.length === 0 || loading) &&
                                styles.rebookButtonDisabled,
                            ]}
                            onPress={handleRebook}
                            disabled={!selectedDate || !selectedTime || selectedServiceIds.length === 0 || loading}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={[styles.rebookButtonText, { fontSize: normalizeFontSize(16) }]}>
                                    {language === 'fr' ? 'Confirmer la réservation' : 'Confirm Booking'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        height: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    closeButton: {},
    closeButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {},
    section: {},
    sectionTitle: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    dateCard: {
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDateCard: {
        backgroundColor: '#2D2D2D',
    },
    dateText: {
        color: '#666',
        fontWeight: '600',
    },
    selectedDateText: {
        color: '#FFFFFF',
    },
    dateWeekday: {
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    dateDay: {
        color: '#2D2D2D',
        fontWeight: '700',
        textAlign: 'center',
    },
    dateMonth: {
        color: '#999',
        fontWeight: '500',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    timeSlot: {
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedTimeSlot: {
        backgroundColor: '#2D2D2D',
    },
    timeText: {
        color: '#666',
        fontWeight: '600',
    },
    selectedTimeText: {
        color: '#FFFFFF',
    },
    serviceCard: {
        backgroundColor: '#F5F5F5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedServiceCard: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontWeight: '600',
        color: '#2D2D2D',
    },
    selectedServiceName: {
        color: '#2D2D2D',
    },
    serviceDetails: {
        color: '#666',
    },
    checkbox: {
        borderWidth: 2,
        borderColor: '#CCC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedCheckbox: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    checkmark: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    summary: {
        backgroundColor: '#F5F5F5',
    },
    summaryTitle: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        color: '#666',
    },
    summaryValue: {
        color: '#2D2D2D',
        fontWeight: '600',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    summaryTotal: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    rebookButton: {
        backgroundColor: '#2D2D2D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rebookButtonDisabled: {
        backgroundColor: '#CCC',
    },
    rebookButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
