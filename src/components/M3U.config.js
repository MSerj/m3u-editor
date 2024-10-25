import arrayMove from "array-move";

export const changeEnabledState = (
  newState, // null = toggle
  m3uData,
  reSortData,
  setWorkaround,
  tableRef
) => (evt, data) => {
  let rows = m3uData.rows;
  const length = rows.length;
  data.forEach((d) => {
    const index = rows.indexOf(d);
    d.enabled = newState === null ? !d.enabled : newState;
    rows[index] = d;
    rows = arrayMove(rows, index, length);
    rows = reSortData(rows);
  });
  setWorkaround({
    data: { rows },
    resolve: () => {},
  });
  tableRef.current.onAllSelected(false);
};

export function filterByLanguageCode(channels) {
  // List of all common language codes (ISO 639-1 codes)
  const excludedCodes = [
    "EN",
    "DE",
    "PL",
    "FR",
    "ES",
    "IT",
    "PT",
    "NL",
    "SV",
    "DA",
    "NO",
    "FI",
    "IS",
    "IN",
    "SE",
    "DK",
    "AU",
    "EE",
    "TR",
    "UK",
    "US",
    "UA",
    "GR",
    "HU",
    "CS",
    "SK",
    "BG",
    "HR",
    "SL",
    "LT",
    "LV",
    "ET",
    "SR",
    "MK",
    "BS",
    "GA",
    "CY",
    "MT",
    "ZH",
    "JA",
    "KO",
    "CZ",
    "AE",
    "EG",
    "BR",
    "QA",
  ];

  // Regex to check for a space before the language code
  const regex = new RegExp(`\\s+(${excludedCodes.join("|")})$`, "i");

  return channels.filter((channel) => {
    const channelName = channel.name; // Access the name property
    // Check if the channel name ends with an excluded language code
    return !regex.test(channelName) || /\\s*(RU|RO|MD)$/i.test(channelName);
  });
}

export function filterByPriority(channels) {
  const map = new Map(); // Store the best version of each base item.

  channels.forEach((channel) => {
    const item = channel.name; // Access the name property
    // Extract the base name by removing any known suffix (4k, HD), case-insensitively.
    const baseName = item.replace(/\s*(4k|hd|\w+)$/i, "").trim();

    // Get the current best version from the map, if any.
    const existing = map.get(baseName);

    // Check priority: 4k > HD > Base.
    if (!existing) {
      // If there's no existing item for the base name, add it.
      map.set(baseName, channel);
    } else {
      // Replace the existing item only if the current item has a higher priority
      if (
        (/4k$/i.test(item) && !/4k$/i.test(existing.name)) || // 4K beats everything
        (/hd$/i.test(item) &&
          !/4k$/i.test(existing.name) &&
          !/hd$/i.test(existing.name)) // HD beats base
      ) {
        map.set(baseName, channel);
      }
    }
  });

  // Convert the map values back to an array and keep other keys intact.
  return Array.from(map.values()).concat(
    channels.filter(
      (channel) => !map.has(channel.name.replace(/\s*(4k|hd|\w+)$/i, "").trim())
    )
  );
}
