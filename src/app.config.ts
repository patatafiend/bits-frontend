const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const recentStart = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 7,
);
const recentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const last30DaysStart = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 30,
);
const last30DaysEnd = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
);

const config = {
  defaults: {
    dateRange: {
      from: startOfMonth,
      to: endOfMonth,
    },
    recentDateRange: {
      from: recentStart,
      to: recentEnd,
    },
    last30DaysDateRange: {
      from: last30DaysStart,
      to: last30DaysEnd,
    },
    last3monthsDateRange: {
      from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      to: now,
    },
  },
  numberFormat: {
    decimalPlaces: 2,
    includeSign: false,
    currency: "₱",
    type: "long",
  },
  dateFormat: "MM/dd/yyyy",
  timeFormat: " hh:mm a",
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
};

export default config;
