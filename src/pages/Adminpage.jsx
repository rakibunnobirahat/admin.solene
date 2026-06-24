import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, updateBookingStatus } from '../api/bookings';
import { getTreatments, addTreatment, deleteTreatment } from '../api/treatments';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM'
];

const getNextSevenDays = () => {
    const days = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
            dateStr: d.toISOString().split('T')[0],
            dayName: weekdayNames[d.getDay()],
            dayOfMonth: d.getDate(),
            monthLabel: monthNames[d.getMonth()]
        });
    }
    return days;
};

// Safely parse a price that may be a number, a "$180" string, or missing
const parsePrice = (price) => {
    if (price === null || price === undefined) return NaN;
    return parseFloat(String(price).replace(/[^0-9.]/g, ''));
};

const Adminpage = () => {
    const { user, logout } = useAuth();

    // Navigation tab state
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'bookings', 'treatments'

    // Status tracking for operations
    const [treatmentStatus, setTreatmentStatus] = useState(null);
    const [isAddingTreatment, setIsAddingTreatment] = useState(false);
    const [treatmentForm, setTreatmentForm] = useState({ name: '', description: '', price: '', icon: '' });

    // Data lists state
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState(null);

    const [treatments, setTreatments] = useState([]);
    const [treatmentsLoading, setTreatmentsLoading] = useState(true);
    const [treatmentsError, setTreatmentsError] = useState(null);

    // Bookings section filtering
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Reschedule inline panel state
    const [rescheduleId, setRescheduleId] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState(null);
    const [rescheduleTime, setRescheduleTime] = useState(null);
    const daysList = getNextSevenDays();

    // Data loading logic
    const fetchBookings = async () => {
        setBookingsLoading(true);
        setBookingsError(null);
        try {
            const result = await getBookings(API_BASE_URL);
            if (result && result.success && result.data) {
                setBookings(result.data);
            } else {
                setBookingsError("Invalid response from server");
            }
        } catch (error) {
            setBookingsError("Could not retrieve bookings. Ensure the backend server is running.");
        } finally {
            setBookingsLoading(false);
        }
    };

    const fetchTreatments = async () => {
        setTreatmentsLoading(true);
        setTreatmentsError(null);
        try {
            const result = await getTreatments(API_BASE_URL);
            if (result && result.success && result.data) {
                setTreatments(result.data);
            } else {
                setTreatmentsError("Invalid treatments response");
            }
        } catch (error) {
            setTreatmentsError("Could not retrieve treatments. Ensure the backend server is running.");
        } finally {
            setTreatmentsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchTreatments();
    }, []);

    const handleTreatmentFormChange = (e) => {
        const { name, value } = e.target;
        setTreatmentForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTreatmentSubmit = async (e) => {
        e.preventDefault();
        setIsAddingTreatment(true);
        setTreatmentStatus(null);

        try {
            const result = await addTreatment(
                API_BASE_URL,
                treatmentForm.name,
                treatmentForm.description,
                treatmentForm.price,
                treatmentForm.icon
            );
            if (result && result.success) {
                setTreatmentStatus({ type: 'success', message: 'Treatment added successfully!' });
                setTreatmentForm({ name: '', description: '', price: '', icon: '' });
                fetchTreatments();
            } else {
                setTreatmentStatus({ type: 'error', message: result.error || 'Failed to add treatment.' });
            }
        } catch (error) {
            setTreatmentStatus({ type: 'error', message: 'Failed to add treatment. Please try again.' });
        } finally {
            setIsAddingTreatment(false);
        }
    };

    const handleDeleteTreatmentClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this treatment service?")) {
            return;
        }
        try {
            const result = await deleteTreatment(API_BASE_URL, id);
            if (result && result.success) {
                setTreatments(prev => prev.filter(t => t._id !== id));
            } else {
                alert(`Failed to delete treatment: ${result.error}`);
            }
        } catch (error) {
            alert(`Failed to delete treatment: ${error.message}`);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const result = await updateBookingStatus(API_BASE_URL, id, newStatus);
            if (result && result.success) {
                setBookings(prev => prev.map(b => b._id === id ? result.data : b));
            }
        } catch (error) {
            alert(`Failed to update status: ${error.message}`);
        }
    };

    const handleRescheduleConfirm = async (id) => {
        if (!rescheduleDate || !rescheduleTime) {
            alert('Please select both a new date and time.');
            return;
        }
        try {
            const result = await updateBookingStatus(
                API_BASE_URL, id, 'Booked',
                { date: rescheduleDate.dateStr, time: rescheduleTime }
            );
            if (result && result.success) {
                setBookings(prev => prev.map(b => b._id === id ? result.data : b));
                setRescheduleId(null);
                setRescheduleDate(null);
                setRescheduleTime(null);
            }
        } catch (error) {
            alert(`Failed to reschedule: ${error.message}`);
        }
    };

    // Client display name resolver (compatibility check)
    const getDisplayName = (b) => {
        if (b.firstName || b.lastName) {
            return `${b.firstName || ''} ${b.lastName || ''}`.trim();
        }
        return b.name || 'Anonymous Client';
    };

    // Search and filter for bookings list
    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filter === 'All' || (b.status || '').toLowerCase() === filter.toLowerCase();

        const fullName = getDisplayName(b).toLowerCase();
        const email = (b.email || '').toLowerCase();
        const phone = (b.phone || '');
        const treatment = (b.treatment || '').toLowerCase();
        const query = searchQuery.toLowerCase().trim();

        const matchesSearch = !query ||
            fullName.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            treatment.includes(query);

        return matchesStatus && matchesSearch;
    });

    // Counts mapping
    const counts = {
        All: bookings.length,
        Booked: bookings.filter(b => b.status === 'Booked').length,
        Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        Completed: bookings.filter(b => b.status === 'Completed').length,
        Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
        Missed: bookings.filter(b => b.status === 'Missed').length
    };

    // Date formatting helper
    const formatBookingDate = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Dashboard calculations (memoized so they don't recompute on every render)
    const estimatedRevenue = useMemo(() => {
        let total = 0;
        const paidBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed');
        paidBookings.forEach(booking => {
            const priceVal = parsePrice(booking.price);
            if (!isNaN(priceVal)) {
                total += priceVal;
                return;
            }
            // Fallback for legacy bookings
            const treatment = treatments.find(t =>
                (t.name || '').toLowerCase().trim() === (booking.treatment || '').toLowerCase().trim()
            );
            const fallbackVal = parsePrice(treatment?.price);
            if (!isNaN(fallbackVal)) {
                total += fallbackVal;
            }
        });
        return total;
    }, [bookings, treatments]);

    const popularTreatments = useMemo(() => {
        const countsMap = {};
        bookings.forEach(b => {
            if (b.treatment) {
                countsMap[b.treatment] = (countsMap[b.treatment] || 0) + 1;
            }
        });
        return Object.entries(countsMap)
            .map(([name, count]) => {
                const treatment = treatments.find(t =>
                    (t.name || '').toLowerCase().trim() === name.toLowerCase().trim()
                );
                return { name, count, price: treatment?.price || '' };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [bookings, treatments]);

    const upcomingBookings = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return [...bookings]
            .filter(b => (b.status === 'Booked' || b.status === 'Confirmed') && b.date && b.date >= todayStr)
            .sort((a, b) => {
                if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
                return (a.time || '').localeCompare(b.time || '');
            })
            .slice(0, 5);
    }, [bookings]);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-bg-cream font-sans antialiased text-text-dark">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200/60 flex flex-col shrink-0">
                {/* Brand Logo & Meta */}
                <div className="p-6 border-b border-gray-100 flex flex-row justify-start items-center gap-3 w-60">
                    <img src="/logo/logoicon.svg" className='w-[25%]' alt="logo" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-serif text-primary">Solène</h1>
                        <p className="text-[10px] text-text-muted font-semibold tracking-widest uppercase">Med Spa Admin</p>
                    </div>
                </div>

                {/* Sidebar Navigation Menu */}
                <nav className="flex-1 p-4 space-y-1.5">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'dashboard'
                            ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                            : 'text-text-muted hover:text-text-dark hover:bg-gray-50'
                            }`}
                    >
                        <span className="font-icon mr-3 text-lg">dashboard</span>
                        Dashboard
                    </button>

                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'bookings'
                            ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                            : 'text-text-muted hover:text-text-dark hover:bg-gray-50'
                            }`}
                    >
                        <span className="font-icon mr-3 text-lg">calendar_month</span>
                        Bookings
                        {counts.Booked > 0 && (
                            <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                {counts.Booked}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('treatments')}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'treatments'
                            ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                            : 'text-text-muted hover:text-text-dark hover:bg-gray-50'
                            }`}
                    >
                        <span className="font-icon mr-3 text-lg">medical_services</span>
                        Treatments
                    </button>
                </nav>

                {/* Back Link Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <a
                        href="/"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <span className="font-icon text-sm">arrow_back</span>
                        Back to Website
                    </a>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">

                {/* Upper Header Dashboard Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/50 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold font-serif tracking-wide capitalize">
                            {activeTab === 'dashboard' && 'Dashboard Overview'}
                            {activeTab === 'bookings' && 'Bookings Manager'}
                            {activeTab === 'treatments' && 'Service Catalog'}
                        </h2>
                        <p className="text-xs text-text-muted mt-1 font-medium">
                            {activeTab === 'dashboard' && 'Key spa metrics, status graphs, and upcoming schedule.'}
                            {activeTab === 'bookings' && 'Browse through client reservations, search, reschedule, or approve.'}
                            {activeTab === 'treatments' && 'Manage medical spa treatment options, pricing, and descriptions.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Refresh Button */}
                        <button
                            onClick={() => {
                                fetchBookings();
                                fetchTreatments();
                            }}
                            className="p-3 bg-white hover:bg-gray-50 border border-gray-200 text-text-muted hover:text-text-dark rounded-xl transition-all shadow-sm cursor-pointer hover:shadow"
                            title="Refresh Data"
                        >
                            <span className="font-icon text-lg block leading-none">refresh</span>
                        </button>
                        <div className="text-right hidden sm:block">
                            <span className="text-[10px] font-bold text-text-muted uppercase block">Current Time</span>
                            <span className="text-sm font-semibold text-text-dark">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        {/* Signed-in admin + logout */}
                        {user?.email && (
                            <div className="text-right hidden md:block">
                                <span className="text-[10px] font-bold text-text-muted uppercase block">Signed in</span>
                                <span className="text-sm font-semibold text-text-dark">{user.email}</span>
                            </div>
                        )}
                        <button
                            onClick={logout}
                            className="p-3 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-text-muted hover:text-red-600 rounded-xl transition-all shadow-sm cursor-pointer hover:shadow"
                            title="Sign out"
                        >
                            <span className="font-icon text-lg block leading-none">logout</span>
                        </button>
                    </div>
                </div>

                {/* Section Content Switches */}
                <div className="animate-fade-in">

                    {/* SECTION: DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Analytics KPI grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                                    <span className="font-icon text-2xl text-primary mb-3 block">calendar_today</span>
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Total Bookings</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-text-dark mt-1 block">
                                        {bookingsLoading ? '...' : counts.All}
                                    </span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                                    <span className="font-icon text-2xl text-amber-500 mb-3 block">pending_actions</span>
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Booked</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1 block">
                                        {bookingsLoading ? '...' : counts.Booked}
                                    </span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                                    <span className="font-icon text-2xl text-green-600 mb-3 block">check_circle</span>
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Confirmed</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-green-700 mt-1 block">
                                        {bookingsLoading ? '...' : counts.Confirmed}
                                    </span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                                    <span className="font-icon text-2xl text-blue-600 mb-3 block">verified</span>
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Completed</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-blue-700 mt-1 block">
                                        {bookingsLoading ? '...' : counts.Completed}
                                    </span>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 relative overflow-hidden group hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                                    <span className="font-icon text-2xl text-primary mb-3 block">payments</span>
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Est. Revenue</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-primary mt-1 block">
                                        {bookingsLoading || treatmentsLoading ? '$...' : `$${estimatedRevenue.toLocaleString()}`}
                                    </span>
                                </div>
                            </div>

                            {/* Secondary graphs / data rows */}
                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Left Side: Upcoming Schedule */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/50 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2">
                                            <span className="font-icon text-primary">schedule</span>
                                            Upcoming Schedule
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('bookings')}
                                            className="text-xs font-semibold cursor-pointer text-primary hover:underline flex items-center gap-0.5"
                                        >
                                            View all bookings <span className="font-icon text-sm">chevron_right</span>
                                        </button>
                                    </div>

                                    {bookingsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-10 space-y-2">
                                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <p className="text-xs text-text-muted">Loading appointments...</p>
                                        </div>
                                    ) : upcomingBookings.length === 0 ? (
                                        <div className="text-center text-xs text-text-muted py-12 border border-dashed border-gray-100 rounded-xl">
                                            No upcoming bookings found for today or the future.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {upcomingBookings.map(b => (
                                                <div key={b._id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <Link to={`/booking/${b._id}`} className="text-sm font-semibold text-text-dark hover:text-primary hover:underline transition-colors">{getDisplayName(b)}</Link>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${b.status === 'Confirmed'
                                                                ? 'bg-green-50 text-green-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                                }`}>
                                                                {b.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-primary font-medium">{b.treatment}</div>
                                                        <div className="text-[10px] text-text-muted flex items-center gap-2">
                                                            <span className="flex items-center gap-0.5">
                                                                <span className="font-icon text-xs">calendar_today</span>
                                                                {formatBookingDate(b.date)}
                                                            </span>
                                                            <span className="flex items-center gap-0.5">
                                                                <span className="font-icon text-xs">schedule</span>
                                                                {b.time} ({b.duration} • {b.price || 'Contact for pricing'})
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {b.status === 'Booked' && (
                                                        <button
                                                            onClick={() => handleStatusChange(b._id, 'Confirmed')}
                                                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-150 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Visual distributions */}
                                <div className="bg-white rounded-2xl border border-gray-200/50 p-6 space-y-6 shadow-sm">
                                    {/* Status distributions */}
                                    <div className="space-y-4">
                                        <h3 className="text-base font-serif font-bold text-text-dark border-b border-gray-150 pb-2">
                                            Booking Statuses
                                        </h3>
                                        <div className="space-y-3.5">
                                            {[
                                                { label: 'Confirmed', count: counts.Confirmed, color: 'bg-green-600', textColor: 'text-green-700' },
                                                { label: 'Booked', count: counts.Booked, color: 'bg-amber-500', textColor: 'text-amber-600' },
                                                { label: 'Completed', count: counts.Completed, color: 'bg-blue-500', textColor: 'text-blue-600' },
                                                { label: 'Cancelled', count: counts.Cancelled, color: 'bg-red-500', textColor: 'text-red-600' },
                                                { label: 'Missed', count: counts.Missed, color: 'bg-gray-400', textColor: 'text-gray-500' }
                                            ].map(s => {
                                                const total = bookings.length || 1;
                                                const percentage = Math.round((s.count / total) * 100);
                                                return (
                                                    <div key={s.label} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold">
                                                            <span className="text-text-dark">{s.label}</span>
                                                            <span className={s.textColor}>{s.count} ({percentage}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div className={`${s.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Popular Treatments */}
                                    <div className="space-y-4">
                                        <h3 className="text-base font-serif font-bold text-text-dark border-b border-gray-150 pb-2">
                                            Popular Services
                                        </h3>
                                        {bookingsLoading ? (
                                            <div className="py-4 text-center text-xs text-text-muted">Loading trends...</div>
                                        ) : popularTreatments.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-text-muted">No data available</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {popularTreatments.map((t, index) => {
                                                    const maxCount = popularTreatments[0]?.count || 1;
                                                    const barWidth = Math.max(10, Math.round((t.count / maxCount) * 100));
                                                    return (
                                                        <div key={t.name} className="space-y-1">
                                                            <div className="flex justify-between items-baseline gap-2">
                                                                <span className="text-xs font-semibold text-text-dark truncate max-w-[70%]">{index + 1}. {t.name}</span>
                                                                <span className="text-[10px] font-bold text-text-muted shrink-0">{t.count} bookings</span>
                                                            </div>
                                                            <div className="w-full bg-gray-50 rounded-lg h-3 overflow-hidden border border-gray-100 relative">
                                                                <div className="bg-primary/30 h-full rounded-lg transition-all duration-500" style={{ width: `${barWidth}%` }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: BOOKINGS MANAGEMENT */}
                    {activeTab === 'bookings' && (
                        <div className="bg-white rounded-2xl border border-gray-200/50 p-6 space-y-6 shadow-sm">

                            {/* Search and filter toolbar */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                                {/* Status filters */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {['All', 'Booked', 'Confirmed', 'Completed', 'Cancelled', 'Missed'].map(tabName => (
                                        <button
                                            key={tabName}
                                            onClick={() => setFilter(tabName)}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${filter === tabName
                                                ? 'border-primary bg-primary text-white scale-102 shadow-sm'
                                                : 'border-gray-200 bg-gray-50/50 hover:bg-gray-150/40 text-text-muted'
                                                }`}
                                        >
                                            {tabName} ({counts[tabName]})
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic search bar */}
                                <div className="relative w-full md:w-72">
                                    <span className="font-icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search by client, email, treatment..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-gray-50/50 text-xs font-medium placeholder:text-gray-400"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-dark font-semibold text-xs cursor-pointer"
                                        >✕</button>
                                    )}
                                </div>
                            </div>

                            {/* Bookings cards area */}
                            {bookingsLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-sm text-text-muted font-medium">Retrieving appointments...</p>
                                </div>
                            ) : bookingsError ? (
                                <div className="p-6 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl font-semibold text-center">
                                    {bookingsError}
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className="p-12 border border-dashed border-gray-200 rounded-2xl text-center text-text-muted text-sm font-medium">
                                    No {filter !== 'All' ? filter.toLowerCase() : ""} bookings found matching search criteria.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredBookings.map((b) => (
                                        <div
                                            key={b._id}
                                            className="p-5 border border-gray-200/80 rounded-2xl bg-white hover:border-gray-300 hover:shadow-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                        >
                                            {/* Left details pane */}
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <Link to={`/booking/${b._id}`} className="font-bold text-text-dark text-base hover:text-primary hover:underline transition-colors">{getDisplayName(b)}</Link>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${b.status === 'Confirmed'
                                                        ? 'bg-green-50 text-green-700 border border-green-150'
                                                        : b.status === 'Completed'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-150'
                                                            : b.status === 'Cancelled'
                                                                ? 'bg-red-50 text-red-700 border border-red-150'
                                                                : b.status === 'Missed'
                                                                    ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-150'
                                                        }`}>
                                                        {b.status}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-text-muted bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                                        Duration: {b.duration}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-full">
                                                        {b.price || 'Contact for pricing'}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-primary">{b.treatment}</div>
                                                <div className="text-xs text-text-muted flex items-center gap-4 pt-0.5 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-icon text-sm">calendar_today</span>
                                                        {formatBookingDate(b.date)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-icon text-sm">schedule</span>
                                                        {b.time}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-text-muted/80 font-medium pt-1">
                                                    <span className="inline-flex items-center gap-1 mr-3"><span className="font-icon text-xs">mail</span> {b.email}</span>
                                                    <span className="inline-flex items-center gap-1"><span className="font-icon text-xs">call</span> {b.phone}</span>
                                                </div>
                                                {b.notes && (
                                                    <div className="text-xs text-text-muted font-normal italic mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150/50 max-w-2xl">
                                                        "{b.notes}"
                                                    </div>
                                                )}
                                                <Link
                                                    to={`/booking/${b._id}`}
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover hover:underline transition-colors mt-1"
                                                >
                                                    <span className="font-icon text-xs">visibility</span>
                                                    View Full Details
                                                </Link>
                                            </div>

                                            {/* Right action controls */}
                                            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 w-full md:w-auto md:shrink-0 pt-3 md:pt-0 border-t border-gray-100 md:border-t-0 justify-end items-stretch sm:items-center">
                                                {b.status === 'Booked' && (
                                                    <button
                                                        onClick={() => handleStatusChange(b._id, 'Confirmed')}
                                                        className="px-3.5 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors cursor-pointer text-center"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {(b.status === 'Booked' || b.status === 'Confirmed') && (
                                                    <button
                                                        onClick={() => handleStatusChange(b._id, 'Completed')}
                                                        className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer text-center"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {(b.status === 'Booked' || b.status === 'Confirmed') && (
                                                    <button
                                                        onClick={() => handleStatusChange(b._id, 'Cancelled')}
                                                        className="px-3.5 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer text-center"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {(b.status === 'Booked' || b.status === 'Confirmed') && (
                                                    <button
                                                        onClick={() => handleStatusChange(b._id, 'Missed')}
                                                        className="px-3.5 py-2 bg-gray-50 text-gray-600 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer text-center"
                                                    >
                                                        Mark Missed
                                                    </button>
                                                )}
                                                {(b.status === 'Cancelled' || b.status === 'Missed' || b.status === 'Completed') && rescheduleId !== b._id && (
                                                    <button
                                                        onClick={() => {
                                                            setRescheduleId(b._id);
                                                            setRescheduleDate(null);
                                                            setRescheduleTime(null);
                                                        }}
                                                        className="px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-250 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                                                    >
                                                        <span className="font-icon text-xs">edit_calendar</span>
                                                        Re-open / Reschedule
                                                    </button>
                                                )}
                                            </div>

                                            {/* Reschedule widget drop down panel */}
                                            {rescheduleId === b._id && (
                                                <div className="w-full mt-3 pt-4 border-t border-dashed border-amber-300 bg-amber-50/20 rounded-2xl p-4 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                                            <span className="font-icon text-sm">schedule</span> Choose New Schedule Date & Slot
                                                        </p>
                                                        <button
                                                            onClick={() => setRescheduleId(null)}
                                                            className="text-xs text-text-muted hover:text-text-dark cursor-pointer font-bold"
                                                        >✕ Cancel</button>
                                                    </div>

                                                    {/* Date picker */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Select Date</p>
                                                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                                                            {daysList.map(day => (
                                                                <button
                                                                    key={day.dateStr}
                                                                    onClick={() => setRescheduleDate(day)}
                                                                    className={`p-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${rescheduleDate?.dateStr === day.dateStr
                                                                        ? 'border-primary bg-primary text-white'
                                                                        : 'border-gray-200 bg-white hover:border-gray-300 text-text-dark'
                                                                        }`}
                                                                >
                                                                    <div className="font-bold text-[9px] uppercase opacity-75">{day.dayName}</div>
                                                                    <div className="font-extrabold text-sm my-0.5">{day.dayOfMonth}</div>
                                                                    <div className="text-[9px] opacity-70">{day.monthLabel}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Time picker */}
                                                    {rescheduleDate && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Select Time</p>
                                                            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                                                                {timeSlots.map(time => (
                                                                    <button
                                                                        key={time}
                                                                        onClick={() => setRescheduleTime(time)}
                                                                        className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${rescheduleTime === time
                                                                            ? 'border-primary bg-primary text-white'
                                                                            : 'border-gray-200 bg-white hover:border-gray-300 text-text-dark'
                                                                            }`}
                                                                    >
                                                                        {time}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Confirm Button */}
                                                    <button
                                                        onClick={() => handleRescheduleConfirm(b._id)}
                                                        disabled={!rescheduleDate || !rescheduleTime}
                                                        className="w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-hover shadow-sm"
                                                    >
                                                        {rescheduleDate && rescheduleTime
                                                            ? `Confirm Reschedule — ${rescheduleDate.dayName} ${rescheduleDate.dayOfMonth} ${rescheduleDate.monthLabel} at ${rescheduleTime}`
                                                            : 'Please pick a date and time slot above to save'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION: SERVICE CATALOG (TREATMENTS) */}
                    {activeTab === 'treatments' && (
                        <div className="grid lg:grid-cols-3 gap-6 items-start">
                            {/* Left Side: Services List Grid */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm space-y-4">
                                    <h3 className="text-lg font-serif font-bold text-text-dark border-b border-gray-100 pb-3 flex items-center gap-2">
                                        <span className="font-icon text-primary">spa</span>
                                        Available Services
                                    </h3>

                                    {treatmentsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <p className="text-xs text-text-muted">Loading treatment menu...</p>
                                        </div>
                                    ) : treatmentsError ? (
                                        <div className="p-5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-semibold text-center">
                                            {treatmentsError}
                                        </div>
                                    ) : treatments.length === 0 ? (
                                        <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center text-text-muted text-xs font-medium">
                                            No treatment services configured. Use the form to configure services.
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {treatments.map((t) => (
                                                <div
                                                    key={t._id}
                                                    className="p-5 border border-gray-100 bg-gray-50/40 rounded-2xl relative group hover:border-gray-300 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-4">
                                                            <span className="font-icon text-3xl text-primary">{t.icon || 'spa'}</span>
                                                            <span className="text-lg font-bold text-primary font-serif shrink-0">{t.price ? `$${t.price}` : 'Free'}</span>
                                                        </div>
                                                        <h4 className="font-bold text-sm text-text-dark mt-2.5 font-serif">{t.name}</h4>
                                                        <p className="text-xs text-text-muted font-normal mt-1 leading-relaxed line-clamp-3">
                                                            {t.description || 'No description provided.'}
                                                        </p>
                                                    </div>

                                                    {/* Delete button (displays on group hover or defaults for accessibility) */}
                                                    <div className="mt-4 pt-3 border-t border-gray-100/60 flex justify-end">
                                                        <button
                                                            onClick={() => handleDeleteTreatmentClick(t._id)}
                                                            className="flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                                                            title="Delete service"
                                                        >
                                                            <span className="font-icon text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Add Treatment Form */}
                            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 space-y-5">
                                <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <span className="font-icon text-primary">add_circle</span>
                                    Add Service
                                </h3>

                                <form onSubmit={handleAddTreatmentSubmit} className="flex flex-col gap-4">
                                    {/* Name */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="service_name" className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Service Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="service_name"
                                            value={treatmentForm.name}
                                            onChange={handleTreatmentFormChange}
                                            placeholder="e.g. Signature HydraFacial"
                                            required
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-gray-50/50 text-xs font-semibold placeholder:text-gray-300"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="service_desc" className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Service Description</label>
                                        <textarea
                                            name="description"
                                            id="service_desc"
                                            value={treatmentForm.description}
                                            onChange={handleTreatmentFormChange}
                                            placeholder="e.g. Deeply cleanse, extract, and hydrate the skin with nourishing serums."
                                            rows="3"
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-gray-50/50 text-xs font-medium placeholder:text-gray-300 resize-none leading-relaxed"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="service_price" className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Price (USD)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs pointer-events-none">$</span>
                                            <input
                                                type="text"
                                                name="price"
                                                id="service_price"
                                                value={treatmentForm.price}
                                                onChange={handleTreatmentFormChange}
                                                placeholder="e.g. 180"
                                                required
                                                className="w-full pl-7 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-gray-50/50 text-xs font-semibold placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Icon */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="service_icon" className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Google Icon Name</label>
                                        <input
                                            type="text"
                                            name="icon"
                                            id="service_icon"
                                            value={treatmentForm.icon}
                                            onChange={handleTreatmentFormChange}
                                            placeholder="e.g. spa, face, dermatology, self_improvement"
                                            required
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-gray-50/50 text-xs font-semibold placeholder:text-gray-350"
                                        />
                                        <span className="text-[9px] text-text-muted font-medium">Use any standard Google Material Symbols name.</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isAddingTreatment}
                                        className={`w-full py-3.5 rounded-xl cursor-pointer font-bold transition-all shadow-sm text-xs mt-1 text-white ${isAddingTreatment
                                            ? 'bg-primary/70 cursor-not-allowed'
                                            : 'bg-primary hover:bg-primary-hover hover:shadow'
                                            }`}
                                    >
                                        {isAddingTreatment ? 'Adding Service...' : 'Add Service'}
                                    </button>

                                    {treatmentStatus && (
                                        <div className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 ${treatmentStatus.type === 'success'
                                            ? 'bg-green-50 text-green-800 border-green-200'
                                            : 'bg-red-50 text-red-800 border-red-200'
                                            }`}>
                                            <span className="font-icon text-sm shrink-0">
                                                {treatmentStatus.type === 'success' ? 'check_circle' : 'error'}
                                            </span>
                                            {treatmentStatus.message}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Adminpage;