import { useState } from 'react'
import { useBike } from '../context/BikeContext'
import { bikeService } from '../services/bikeService'
import { formatCurrency, formatOdometer, todayString, getErrorMessage, getVehicleIcon } from '../utils/formatters'
import toast from 'react-hot-toast'

const VEHICLE_TYPES = [
  { id: 'BIKE', label: 'Motorcycle', icon: '🏍️' },
  { id: 'CAR', label: 'Car / SUV', icon: '🚗' },
  { id: 'SCOOTER', label: 'Scooter', icon: '🛵' },
  { id: 'EV', label: 'Electric (EV)', icon: '⚡' },
  { id: 'OTHER', label: 'Other', icon: '🚐' },
]

export default function Bikes() {
  const { bikes, activeBike, switchBike, fetchBikes } = useBike()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    brand: '',
    model: '',
    variant: '',
    vehicle_type: 'CAR',
    registration_number: '',
    purchase_date: todayString(),
    purchase_price: '',
    purchase_odometer: '0',
    current_odometer: '0',
    fuel_type: 'PETROL',
    tank_capacity: '40',
    expected_mileage: '16',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleVehicleTypeSelect = (typeId) => {
    let defaultTank = '40'
    let defaultMileage = '16'
    let defaultFuel = 'PETROL'

    if (typeId === 'BIKE') {
      defaultTank = '13'
      defaultMileage = '40'
    } else if (typeId === 'SCOOTER') {
      defaultTank = '6'
      defaultMileage = '45'
    } else if (typeId === 'EV') {
      defaultTank = '50' // kWh battery
      defaultMileage = '6' // km/kWh
      defaultFuel = 'ELECTRIC'
    }

    setForm({
      ...form,
      vehicle_type: typeId,
      tank_capacity: defaultTank,
      expected_mileage: defaultMileage,
      fuel_type: defaultFuel,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        variant: form.variant ? form.variant.trim() : null,
        vehicle_type: form.vehicle_type || 'BIKE',
        registration_number: form.registration_number ? form.registration_number.trim() : '',
        purchase_date: form.purchase_date || todayString(),
        purchase_price: form.purchase_price ? Number(form.purchase_price) : 0,
        purchase_odometer: form.purchase_odometer ? Number(form.purchase_odometer) : 0,
        current_odometer: form.current_odometer
          ? Number(form.current_odometer)
          : form.purchase_odometer
          ? Number(form.purchase_odometer)
          : 0,
        fuel_type: form.fuel_type || 'PETROL',
        tank_capacity: form.tank_capacity ? Number(form.tank_capacity) : 15,
        expected_mileage: form.expected_mileage ? Number(form.expected_mileage) : 30,
      }

      await bikeService.create(payload)
      toast.success('Vehicle added successfully to your garage! 🚗🏍️')
      setShowModal(false)
      setForm({
        brand: '',
        model: '',
        variant: '',
        vehicle_type: 'CAR',
        registration_number: '',
        purchase_date: todayString(),
        purchase_price: '',
        purchase_odometer: '0',
        current_odometer: '0',
        fuel_type: 'PETROL',
        tank_capacity: '40',
        expected_mileage: '16',
      })
      fetchBikes()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to add vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this vehicle? All fuel logs and service records will also be deleted.')) return
    try {
      await bikeService.delete(id)
      toast.success('Vehicle removed from garage')
      fetchBikes()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to delete vehicle')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>My Garage & Vehicles</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Manage cars, bikes, scooters, EVs, and specifications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 btn-interactive shadow-sm hover:shadow-md"
        >
          <span>+</span> Add Vehicle
        </button>
      </div>

      {bikes.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto mt-8 animate-fade-in">
          <div className="text-5xl mb-3 animate-float">🚗</div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Your Garage is Empty</h3>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--color-muted)' }}>
            Add your car, motorcycle, scooter, or EV to start tracking expenses, fuel efficiency, and maintenance.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold btn-interactive shadow-md"
          >
            + Add First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bikes.map((bike) => {
            const icon = getVehicleIcon(bike.vehicle_type)
            return (
              <div
                key={bike.id}
                className={`card card-hover p-5 relative border-2 cursor-pointer transition-all ${
                  activeBike?.id === bike.id ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                onClick={() => switchBike(bike)}
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl">
                    {icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeBike?.id === bike.id && (
                      <span className="bg-blue-500 text-white text-xs px-2.5 py-0.5 rounded-full font-medium shadow-sm">
                        Active
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, bike.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 text-xs rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete Vehicle"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
                    {bike.vehicle_type || 'BIKE'}
                  </span>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    {bike.brand} {bike.model}
                  </h3>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {bike.registration_number ? bike.registration_number : 'No Registration'} • {bike.fuel_type}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t space-y-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-muted)' }}>Current Odometer</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatOdometer(bike.current_odometer)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-muted)' }}>Purchase Price</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(bike.purchase_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-muted)' }}>Tank / Battery</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {bike.tank_capacity} {bike.fuel_type === 'ELECTRIC' ? 'kWh' : 'L'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card animate-modal-pop p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Add Vehicle to Garage</h2>

            {/* Vehicle Type Selector Tabs */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-muted)' }}>Vehicle Type</label>
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {VEHICLE_TYPES.map((vt) => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => handleVehicleTypeSelect(vt.id)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      form.vehicle_type === vt.id
                        ? 'bg-blue-600 text-white shadow-sm scale-105'
                        : 'hover:opacity-80'
                    }`}
                    style={form.vehicle_type !== vt.id ? { color: 'var(--color-muted)' } : {}}
                  >
                    <span className="text-base">{vt.icon}</span>
                    <span className="text-[10px] truncate">{vt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Brand / Make *</label>
                  <input
                    name="brand"
                    placeholder="e.g. Hyundai, Toyota, Honda, Tata"
                    value={form.brand}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Model *</label>
                  <input
                    name="model"
                    placeholder="e.g. Creta, Swift, Nexon, Classic 350"
                    value={form.model}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Registration Number</label>
                  <input
                    name="registration_number"
                    placeholder="e.g. MH 12 AB 1234"
                    value={form.registration_number}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Fuel / Power Type</label>
                  <select
                    name="fuel_type"
                    value={form.fuel_type}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric (EV)</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={form.purchase_date}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Purchase Price (₹)</label>
                  <input
                    type="number"
                    name="purchase_price"
                    placeholder="e.g. 1150000"
                    value={form.purchase_price}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Current Odo (KM)</label>
                  <input
                    type="number"
                    name="current_odometer"
                    placeholder="0"
                    value={form.current_odometer}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                    {form.fuel_type === 'ELECTRIC' ? 'Battery (kWh)' : 'Tank (Litres)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="tank_capacity"
                    placeholder="40"
                    value={form.tank_capacity}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                    {form.fuel_type === 'ELECTRIC' ? 'Range (km/kWh)' : 'Mileage (km/L)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="expected_mileage"
                    placeholder="16"
                    value={form.expected_mileage}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors btn-interactive shadow-md"
                >
                  {loading ? 'Adding Vehicle...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
