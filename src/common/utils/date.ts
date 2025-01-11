export function parseDate(dateString: string): Date | null {
  try {
    if (dateString.includes('undefined')) return null;
    const now = new Date();
    const months: { [key: string]: number } = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };
    const isValidDate = (date: Date): boolean =>
      date instanceof Date && !Number.isNaN(date.getTime());
    if (dateString.includes('Today') || dateString.includes('Overnight'))
      return now;
    if (dateString.includes('Tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow;
    }
    dateString = dateString
      .toString()
      .replace(/\$\d+(\.\d+)?/g, '')
      .replace(/\bfree\b/gi, '')
      .trim();
    if (dateString.includes(' - ')) {
      const [start] = dateString
        .split(' - ')
        .map((part: string) => part.split(' '));
      const startMonth = months[start[0]];
      const startDay = Number.parseInt(start[1]);
      const startYear =
        startMonth < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
      const startDate = new Date(startYear, startMonth, startDay);
      return isValidDate(startDate) ? startDate : null;
    }
    const dateParts = dateString.split(', ');
    const [monthName, day] = dateParts[1]?.split(' ') || [];
    const parsedMonth = months[monthName];
    const parsedDay = Number.parseInt(day);
    const parsedYear =
      parsedMonth < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    const date = new Date(parsedYear, parsedMonth, parsedDay);
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
}
