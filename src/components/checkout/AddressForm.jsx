'use client';

// One simple address, reused as both the shipping and billing address on
// the order — TickToss doesn't distinguish the two.
export default function AddressForm({ value, onChange }) {
  const handleField = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          className="tt-input"
          placeholder="First name"
          required
          value={value.firstName || ''}
          onChange={handleField('firstName')}
        />
        <input
          className="tt-input"
          placeholder="Last name"
          required
          value={value.lastName || ''}
          onChange={handleField('lastName')}
        />
      </div>
      <input
        className="tt-input"
        placeholder="Phone number"
        required
        value={value.phone || ''}
        onChange={handleField('phone')}
      />
      <input
        className="tt-input"
        placeholder="Address (street, area, landmark)"
        required
        value={value.address || ''}
        onChange={handleField('address')}
      />
      <input
        className="tt-input"
        placeholder="City"
        required
        value={value.city || ''}
        onChange={handleField('city')}
      />
    </div>
  );
}
