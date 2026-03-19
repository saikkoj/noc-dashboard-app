/**
 * BandwidthUpgradeModal — dialog for ordering more bandwidth or temporary boost.
 */
import React, { useState, useMemo } from 'react';
import type { CustomerService } from '../types/network';
import { BANDWIDTH_TIERS, SERVICE_TYPE_LABELS } from '../data/customerData';
import { formatTraffic, BRAND_PRIMARY } from '../utils';

interface Props {
  service: CustomerService;
  onClose: () => void;
  onSubmit: (requestedMbps: number, temporary: boolean, days: number, reason: string) => void;
}

export function BandwidthUpgradeModal({ service, onClose, onSubmit }: Props) {
  const availableTiers = useMemo(
    () => BANDWIDTH_TIERS.filter(t => t.mbps > service.orderedBandwidthMbps),
    [service.orderedBandwidthMbps],
  );
  const [selectedMbps, setSelectedMbps] = useState(availableTiers[0]?.mbps ?? service.orderedBandwidthMbps * 2);
  const [temporary, setTemporary] = useState(false);
  const [tempDays, setTempDays] = useState(3);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedTier = BANDWIDTH_TIERS.find(t => t.mbps === selectedMbps);
  const currentTier = BANDWIDTH_TIERS.find(t => t.mbps === service.orderedBandwidthMbps);
  const priceDiff = (selectedTier?.priceEur ?? 0) - (currentTier?.priceEur ?? service.monthlyCostEur);

  const handleSubmit = () => {
    onSubmit(selectedMbps, temporary, tempDays, reason);
    setSubmitted(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a22', borderRadius: 12, padding: 24, width: 520, maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {submitted ? (
          <>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Request Submitted!</div>
              <div style={{ color: '#999', fontSize: 13, lineHeight: 1.6 }}>
                {temporary
                  ? `Temporary Bandwidth Upgrade ${formatTraffic(selectedMbps / 1000)} / ${tempDays} days.`
                  : `Permanent Bandwidth Upgrade ${formatTraffic(selectedMbps / 1000)}.`}
                <br />Your request will be processed and we will contact you.
              </div>
            </div>
            <button onClick={onClose} style={{ ...btnPrimary, width: '100%', marginTop: 16 }}>Close</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Order More Bandwidth</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{service.name}</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Current */}
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Current Service</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#ccc' }}>{SERVICE_TYPE_LABELS[service.type]}: {formatTraffic(service.orderedBandwidthMbps / 1000)}</span>
                <span style={{ color: '#888' }}>{service.monthlyCostEur.toLocaleString('fi-FI')} €/kk</span>
              </div>
              <div style={{ fontSize: 11, color: '#fd8232', marginTop: 4 }}>
                Usage: {((service.currentUsageMbps / service.orderedBandwidthMbps) * 100).toFixed(0)}% · Huippu: {((service.peakUsageMbps / service.orderedBandwidthMbps) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Temporary toggle */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setTemporary(false)}
                style={temporary ? tabInactive : tabActive}
              >Permanent Upgrade</button>
              <button
                onClick={() => setTemporary(true)}
                style={temporary ? tabActive : tabInactive}
              >Temporary Upgrade</button>
            </div>

            {/* Tier selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Select New Bandwidth</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {availableTiers.map(tier => (
                  <button
                    key={tier.mbps}
                    onClick={() => setSelectedMbps(tier.mbps)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                      border: selectedMbps === tier.mbps ? `2px solid ${BRAND_PRIMARY}` : '1px solid rgba(255,255,255,0.12)',
                      background: selectedMbps === tier.mbps ? `${BRAND_PRIMARY}18` : 'transparent',
                      color: selectedMbps === tier.mbps ? BRAND_PRIMARY : '#ccc',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{tier.label}</div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{tier.priceEur.toLocaleString('fi-FI')} €/kk</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Temp duration */}
            {temporary && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Duration (days)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 3, 7, 14, 30].map(d => (
                    <button
                      key={d}
                      onClick={() => setTempDays(d)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                        border: tempDays === d ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                        background: tempDays === d ? 'rgba(59,130,246,0.12)' : 'transparent',
                        color: tempDays === d ? '#3B82F6' : '#999',
                      }}
                    >{d} pv</button>
                  ))}
                </div>
              </div>
            )}

            {/* Price summary */}
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#ccc' }}>New Price</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>
                  {(selectedTier?.priceEur ?? 0).toLocaleString('fi-FI')} €/kk
                  {temporary && <span style={{ color: '#888', fontWeight: 400 }}> × {tempDays} pv</span>}
                </span>
              </div>
              {!temporary && priceDiff > 0 && (
                <div style={{ fontSize: 11, color: '#fd8232', marginTop: 4 }}>
                  +{priceDiff.toLocaleString('fi-FI')} €/kk additional
                </div>
              )}
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Reason (optional)</div>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Why is a bandwidth upgrade needed…"
                style={{
                  width: '100%', minHeight: 60, padding: 10, borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
                  color: '#ccc', fontSize: 12, resize: 'vertical',
                }}
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSubmit} style={{ ...btnPrimary, flex: 1 }}>
                {temporary ? 'Request Temporary Upgrade' : 'Submit Upgrade Request'}
              </button>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, border: 'none',
  background: '#FF2D8D', color: '#fff', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'transparent', color: '#999', cursor: 'pointer',
  fontSize: 13,
};

const tabActive: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, border: '1px solid #3B82F6',
  background: 'rgba(59,130,246,0.12)', color: '#3B82F6', cursor: 'pointer', fontSize: 12,
};

const tabInactive: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12,
};
