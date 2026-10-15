const SLOT_MINUTES = 30;
const START_MINUTES = 8 * 60;
const END_MINUTES = 18 * 60;

export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

export function timeToMinutes(time) {
  if (!time || typeof time !== "string") {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function createTimeSlots() {
  const totalSlots = (END_MINUTES - START_MINUTES) / SLOT_MINUTES;

  return Array.from({ length: totalSlots }, (_, index) => {
    const startMinutes = START_MINUTES + index * SLOT_MINUTES;

    const endMinutes = startMinutes + SLOT_MINUTES;

    return {
      index,
      startMinutes,
      endMinutes,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
    };
  });
}

export function getBlocksForDay(blocks, diaSemana) {
  return blocks.filter((block) => Number(block.dia_semana) === Number(diaSemana));
}

export function isSlotInsideBlock(slot, block) {
  const blockStart = timeToMinutes(block.hora_inicio);

  const blockEnd = timeToMinutes(block.hora_fin);

  if (blockStart === null || blockEnd === null) {
    return false;
  }

  return slot.startMinutes >= blockStart && slot.startMinutes < blockEnd;
}

export function getBlockStartSlot(block) {
  const startMinutes = timeToMinutes(block.hora_inicio);

  if (startMinutes === null) return -1;

  return Math.floor((startMinutes - START_MINUTES) / SLOT_MINUTES);
}

export function getBlockEndSlot(block) {
  const endMinutes = timeToMinutes(block.hora_fin);

  if (endMinutes === null) return -1;

  return Math.ceil((endMinutes - START_MINUTES) / SLOT_MINUTES);
}

export function isBlockStart(block, slot) {
  return getBlockStartSlot(block) === slot.index;
}

export function isBlockEnd(block, slot) {
  return getBlockEndSlot(block) - 1 === slot.index;
}

export function getSelectionRange(start, end) {
  if (start === null || start === undefined || end === null || end === undefined) {
    return null;
  }

  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
}

export function buildSelectionBlock(day, start, end) {
  const range = getSelectionRange(start, end);

  if (!range) return null;

  const slots = createTimeSlots();

  const startSlot = slots[range.start];
  const endSlot = slots[range.end];

  if (!startSlot || !endSlot) {
    return null;
  }

  return {
    dia_semana: day,
    hora_inicio: startSlot.startTime,
    hora_fin: endSlot.endTime,
  };
}

export function getSlotState(blocks, diaSemana, slot, selection, selectionRange) {
  const dayBlocks = getBlocksForDay(blocks, diaSemana);

  const occupiedBlock = dayBlocks.find((block) => isSlotInsideBlock(slot, block));

  if (occupiedBlock) {
    return {
      type: "occupied",
      block: occupiedBlock,
    };
  }

  if (selection && Number(selection.day) === Number(diaSemana) && selectionRange) {
    const inside = slot.index >= selectionRange.start && slot.index <= selectionRange.end;

    if (inside) {
      return {
        type: "selection",
        block: null,
      };
    }
  }

  return {
    type: "empty",
    block: null,
  };
}
