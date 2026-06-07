import { VEHICLE_OPTIONS, VehicleType } from '../constants/vehicles';
import VehicleIcon from './VehicleIcon';

const TYPES: VehicleType[] = ['MOTO', 'TAXI', 'FOURGON'];

interface VehiclePickerProps {
  value: VehicleType;
  onChange: (value: VehicleType) => void;
}

export default function VehiclePicker({ value, onChange }: VehiclePickerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-800">Type de véhicule</p>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TYPES.map((type) => {
          const active = value === type;
          const opt = VEHICLE_OPTIONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg px-2 py-3 transition ${
                active
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <VehicleIcon type={type} className={`h-5 w-5 ${active ? 'text-brand-600' : ''}`} />
              <span className="text-xs font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">{VEHICLE_OPTIONS[value].description}</p>
    </div>
  );
}
