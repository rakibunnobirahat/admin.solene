import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking, updateBookingStatus } from '../api/bookings';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const BookingDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form edit states
    const [status, setStatus] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Status options config
    const statusOptions = [
        { value: 'Booked', label: 'Booked', icon: 'pending_actions', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-200' },
        { value: 'Confirmed', label: 'Confirmed', icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-200' },
        { value: 'Completed', label: 'Completed', icon: 'verified', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-200' },
        { value: 'Cancelled', label: 'Cancelled', icon: 'cancel', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-200' },
        { value: 'Missed', label: 'Missed', icon: 'event_busy', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', ring: 'ring-gray-200' }
    ];

    const getStatusOption = (val) => statusOptions.find(o => o.value === val) || statusOptions[0];
    const currentOption = getStatusOption(status);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBookingDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getBooking(API_BASE_URL, id);
            if (result && result.success && result.data) {
                setBooking(result.data);
                setStatus(result.data.status);
            } else {
                setError("Failed to fetch booking details.");
            }
        } catch (err) {
            setError(err.message || "Could not load booking details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchBookingDetails();
        }
    }, [id]);

    const handleStatusUpdateSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setUpdateMessage(null);
        try {
            const result = await updateBookingStatus(API_BASE_URL, id, status);
            if (result && result.success) {
                setBooking(result.data);
                setUpdateMessage({ type: 'success', text: 'Appointment status updated successfully!' });
                setTimeout(() => setUpdateMessage(null), 3000);
            } else {
                setUpdateMessage({ type: 'error', text: result.error || 'Failed to update status.' });
            }
        } catch (err) {
            setUpdateMessage({ type: 'error', text: err.message || 'Error occurred during status update.' });
        } finally {
            setUpdating(false);
        }
    };

    // Client display name resolver
    const getDisplayName = (b) => {
        if (!b) return '';
        if (b.firstName || b.lastName) {
            return `${b.firstName || ''} ${b.lastName || ''}`.trim();
        }
        return b.name || 'Anonymous Client';
    };

    // Date formatter
    const formatBookingDate = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-text-muted font-semibold">Retrieving reservation data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center p-6 space-y-6">
                <div className="bg-white border border-red-200 p-8 rounded-3xl max-w-md w-full shadow-sm text-center space-y-4">
                    <span className="font-icon text-5xl text-red-500">error</span>
                    <h2 className="text-xl font-serif font-bold text-text-dark">Unable to Load Details</h2>
                    <p className="text-xs text-text-muted leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                        Return to Admin Console
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-cream py-12 px-4 md:px-8 font-sans antialiased text-text-dark">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back Button Link */}
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-dark hover:-translate-x-0.5 transition-all cursor-pointer"
                >
                    <span className="font-icon text-sm">arrow_back</span>
                    Back to Admin Console
                </button>

                {/* Main Card */}
                <div className="bg-white border border-gray-200/50 rounded-3xl shadow-sm p-6 md:p-10 space-y-8 animate-fade-in">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase block">Appointment Detail</span>
                            <h2 className="text-3xl font-serif font-bold text-text-dark">
                                {getDisplayName(booking)}
                            </h2>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border self-start sm:self-center tracking-wider uppercase ${booking.status === 'Confirmed'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : booking.status === 'Completed'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : booking.status === 'Cancelled'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : booking.status === 'Missed'
                                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {booking.status}
                        </span>
                    </div>

                    {/* Content Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Treatment & Time */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-gray-50 pb-2">Treatment Details</h3>

                            <div className="space-y-4">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Service / Treatment</span>
                                    <p className="text-lg font-serif font-bold text-primary">{booking.treatment}</p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Price</span>
                                    <p className="text-sm font-semibold">{booking.price || 'Contact for pricing'}</p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Duration</span>
                                    <p className="text-sm font-semibold">{booking.duration}</p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Date</span>
                                    <p className="text-sm font-semibold">{formatBookingDate(booking.date)}</p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Time Slot</span>
                                    <p className="text-sm font-semibold">{booking.time}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Customer Info */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-gray-50 pb-2">Client Contact</h3>

                            <div className="space-y-4">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Full Name</span>
                                    <p className="text-sm font-semibold">{getDisplayName(booking)}</p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Email Address</span>
                                    <p className="text-sm font-semibold hover:underline">
                                        <a href={`mailto:${booking.email}`}>{booking.email}</a>
                                    </p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Phone Number</span>
                                    <p className="text-sm font-semibold">
                                        <a href={`tel:${booking.phone}`}>{booking.phone}</a>
                                    </p>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-text-muted uppercase">Notes & Special Instructions</span>
                                    <p className="text-xs text-text-muted font-normal italic leading-relaxed">
                                        {booking.notes ? `"${booking.notes}"` : 'No client notes.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit status form */}
                    <div className="bg-gray-50/50 border border-gray-200/50 rounded-2xl p-6 md:p-8 space-y-4 mt-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-1.5">
                                <span className="font-icon text-primary text-xl">admin_panel_settings</span>
                                Manage Appointment Status
                            </h3>
                            <p className="text-xs text-text-muted">
                                Transition this booking to a different status state.
                            </p>
                        </div>

                        <form onSubmit={handleStatusUpdateSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            {/* Custom Dropdown */}
                            <div className="relative flex-1" ref={dropdownRef}>
                                {/* Trigger Button */}
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(prev => !prev)}
                                    className={`w-full flex items-center justify-between gap-3 p-3.5 border rounded-xl bg-white text-xs font-semibold cursor-pointer transition-all duration-200 ${dropdownOpen
                                        ? `ring-2 ${currentOption.ring} ${currentOption.border}`
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-7 h-7 rounded-lg ${currentOption.bg} ${currentOption.border} border flex items-center justify-center`}>
                                            <span className={`font-icon text-sm ${currentOption.color}`}>{currentOption.icon}</span>
                                        </span>
                                        <span className="text-text-dark font-bold text-sm">{currentOption.label}</span>
                                        {status !== booking.status && (
                                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Changed</span>
                                        )}
                                    </div>
                                    <span className={`font-icon text-gray-400 text-lg transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <div className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-white border border-gray-200/80 rounded-2xl shadow-lg shadow-black/8 overflow-hidden animate-fade-in">
                                        <div className="p-1.5">
                                            {statusOptions.map((opt) => {
                                                const isSelected = status === opt.value;
                                                const isCurrent = booking.status === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setStatus(opt.value);
                                                            setDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                                                            isSelected
                                                                ? `${opt.bg} ${opt.border} border`
                                                                : 'border border-transparent hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className={`w-7 h-7 rounded-lg ${opt.bg} border ${opt.border} flex items-center justify-center transition-colors`}>
                                                            <span className={`font-icon text-sm ${opt.color} transition-colors`}>{opt.icon}</span>
                                                        </span>
                                                        <div className="flex-1">
                                                            <span className={`text-sm font-semibold ${isSelected ? 'text-text-dark' : 'text-text-dark/80'}`}>{opt.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {isCurrent && (
                                                                <span className="text-[9px] font-bold text-text-muted bg-gray-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Current</span>
                                                            )}
                                                            {isSelected && (
                                                                <span className={`font-icon text-sm ${opt.color}`}>check</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={updating || status === booking.status}
                                className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm uppercase tracking-wider"
                            >
                                {updating ? 'Updating...' : 'Update Status'}
                            </button>
                        </form>

                        {updateMessage && (
                            <div className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 animate-fade-in ${updateMessage.type === 'success'
                                    ? 'bg-green-50 text-green-800 border-green-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                <span className="font-icon text-sm shrink-0">
                                    {updateMessage.type === 'success' ? 'check_circle' : 'error'}
                                </span>
                                {updateMessage.text}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BookingDetailsPage;
