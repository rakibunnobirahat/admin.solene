import React, { useState, useEffect } from 'react';
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
                            <div className="relative flex-1">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full appearance-none p-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-white text-xs font-semibold cursor-pointer"
                                >
                                    <option value="Booked">Booked</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Missed">Missed</option>
                                </select>
                                <span className="font-icon absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">unfold_more</span>
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
