import { Room } from '@/types';

export interface RoomFilterCriteria {
  requestedAttendees: number;
  requiredEquipment: string[];
}

export function filterByCapacity(rooms: Room[], requestedAttendees: number): Room[] {
  if (requestedAttendees <= 0) return rooms;
  return rooms.filter((r) => r.capacity >= requestedAttendees);
}

export function filterByEquipment(rooms: Room[], requiredEquipment: string[]): Room[] {
  if (requiredEquipment.length === 0) return rooms;
  return rooms.filter((r) =>
    requiredEquipment.every((item) => r.equipment.includes(item))
  );
}

export function filterRooms(rooms: Room[], criteria: RoomFilterCriteria): Room[] {
  const byCapacity = filterByCapacity(rooms, criteria.requestedAttendees);
  return filterByEquipment(byCapacity, criteria.requiredEquipment);
}

export function getAvailableEquipment(rooms: Room[]): string[] {
  const set = new Set<string>();
  for (const room of rooms) {
    for (const item of room.equipment) {
      set.add(item);
    }
  }
  return Array.from(set).sort();
}
