"use client";

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DashboardCalendarProps {
    bookings: any[];
}

export function DashboardCalendar({ bookings }: DashboardCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const firstDayOfMonth = getDay(startOfMonth(currentDate));
    // Adjustment for Monday start (0=Sunday, 1=Monday in getDay, but we want Mon=0)
    // French calendar usually starts on Monday.
    // date-fns getDay: 0=Sun, 1=Mon...
    // We want Mon(1)->0, Tue(2)->1... Sun(0)->6
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-500 border-green-600';
            case 'PENDING': return 'bg-yellow-500 border-yellow-600';
            case 'CANCELLED': return 'bg-red-500 border-red-600';
            case 'COMPLETED': return 'bg-blue-500 border-blue-600';
            default: return 'bg-gray-400 border-gray-500';
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    // Group bookings by date
    const getBookingsForDate = (date: Date) => {
        return bookings.filter(b => isSameDay(parseISO(b.scheduled_at), date));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="font-bold text-lg capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Grid Header days */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-[100px]">
                {/* Empty cells for offset */}
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-gray-50/20 border-r border-b border-gray-100" />
                ))}

                {days.map(day => {
                    const dayBookings = getBookingsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isDayToday = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`
                                relative border-r border-b border-gray-100 p-2 transition-colors hover:bg-gray-50
                                ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}
                                ${isDayToday ? 'bg-blue-50/30' : ''}
                            `}
                        >
                            <span className={`
                                text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
                                ${isDayToday ? 'bg-primary text-white' : 'text-gray-700'}
                            `}>
                                {format(day, 'd')}
                            </span>

                            {/* Bookings Markers */}
                            <div className="mt-1 flex flex-wrap gap-1">
                                {dayBookings.map(booking => {
                                    const serviceImage = booking.booking_items?.[0]?.service?.images?.[0];
                                    const statusColor = getStatusColor(booking.status);

                                    return (
                                        <Dialog key={booking.id}>
                                            <DialogTrigger asChild>
                                                <button
                                                    className={`
                                                        h-8 w-8 rounded-full border-2 ${statusColor} 
                                                        overflow-hidden shadow-sm hover:scale-110 transition-transform
                                                        relative group
                                                    `}
                                                    title={`${booking.status} - ${format(parseISO(booking.scheduled_at), 'HH:mm')}`}
                                                >
                                                    {serviceImage ? (
                                                        <img
                                                            src={serviceImage}
                                                            alt="Service"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                        <span className={`w-3 h-3 rounded-full ${statusColor.split(' ')[0]}`} />
                                                        Détails du Rendez-vous
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="flex items-start gap-4">
                                                        {serviceImage && (
                                                            <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                                <img src={serviceImage} alt="Service" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-lg mb-1">
                                                                {booking.salon?.name_fr || booking.salon?.name_en || booking.therapist?.business_name || 'Prestataire'}
                                                            </h4>
                                                            <div className="text-sm text-gray-600 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4" />
                                                                    {format(parseISO(booking.scheduled_at), 'd MMMM yyyy à HH:mm', { locale: fr })}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4" />
                                                                    {booking.salon?.city || booking.therapist?.city}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-gray-100 pt-4">
                                                        <h5 className="font-semibold text-sm mb-2">Services réservés</h5>
                                                        <ul className="space-y-2">
                                                            {booking.booking_items?.map((item: any, i: number) => (
                                                                <li key={i} className="flex justify-between text-sm">
                                                                    <span>{item.service_name || "Service"}</span>
                                                                    <span className="font-medium">
                                                                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(item.price)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <div className="flex justify-between font-bold mt-4 pt-2 border-t border-gray-100">
                                                            <span>Total</span>
                                                            <span className="text-primary">
                                                                {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(booking.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-4 text-xs text-gray-500 justify-center">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> En attente</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Confirmé</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Terminé</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Annulé</div>
            </div>
        </div>
    );
}
