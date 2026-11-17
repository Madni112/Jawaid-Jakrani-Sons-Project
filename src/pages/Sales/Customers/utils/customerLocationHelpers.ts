import { DEFAULT_SUB_AREAS, DEFAULT_AREAS } from '../constants/customerConstants';
import type { CustomerLocation } from '../types/customerTypes';

export const getInitialLocation = (data?: any): CustomerLocation => {
  if (!data) return { subArea: '', area: '' };

  let subArea = data.sub_area || data.subArea || '';
  let area = data.area || '';

  // If subArea is not set, check data.city
  if (!subArea && data.city) {
    subArea = data.city;
  }

  // Check if Location was recorded in notes e.g. "Location: Hyderabad | Cloth Market"
  if (data.notes && data.notes.includes('Location:')) {
    const match = data.notes.match(/Location:\s*([^|\n]+)(?:\s*\|\s*([^\n]+))?/);
    if (match) {
      const noteCity = match[1]?.trim();
      const noteArea = match[2]?.trim();
      if (!subArea) subArea = noteCity;
      if (
        subArea &&
        subArea.toLowerCase() === 'hyderabad' &&
        noteCity &&
        noteCity.toLowerCase() !== 'hyderabad'
      ) {
        subArea = noteCity;
      }
      if (!area && noteArea) area = noteArea;
    }
  }

  // Fallback: If city still empty, scan address for known cities
  if (!subArea && data.address) {
    const addr = String(data.address).toLowerCase();
    for (const dCity of DEFAULT_SUB_AREAS) {
      if (addr.includes(dCity.toLowerCase())) {
        subArea = dCity;
        break;
      }
    }
  }

  // Fallback: If area still empty, scan address for known areas
  if (!area && data.address) {
    const addr = String(data.address).toLowerCase();
    for (const dArea of DEFAULT_AREAS) {
      if (addr.includes(dArea.toLowerCase())) {
        area = dArea;
        break;
      }
    }
  }

  // In case area was erroneously set equal to city, clear it
  if (area && subArea && area.toLowerCase() === subArea.toLowerCase()) {
    area = '';
  }

  return { subArea, area };
};
