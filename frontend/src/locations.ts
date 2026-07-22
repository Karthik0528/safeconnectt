export const INDIAN_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Goa",
  "Rajasthan",
  "Himachal Pradesh",
  "Uttarakhand",
  "Jammu & Kashmir",
  "Gujarat",
  "Punjab",
  "Delhi",
  "West Bengal",
  "Odisha",
  "Assam",
  "Sikkim",
  "Madhya Pradesh",
  "Uttar Pradesh",
];

export const INDIAN_CITIES: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Ooty", "Kodaikanal", "Rameswaram", "Kanyakumari", "Mahabalipuram", "Trichy"],
  "Kerala": ["Kochi", "Munnar", "Trivandrum", "Kozhikode", "Alleppey", "Wayanad", "Varkala"],
  "Karnataka": ["Bengaluru", "Mysuru", "Coorg", "Hampi", "Gokarna", "Mangaluru", "Chikmagalur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Araku Valley", "Guntur"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Maharashtra": ["Mumbai", "Pune", "Nashik", "Nagpur", "Lonavala", "Mahabaleshwar", "Aurangabad"],
  "Goa": ["North Goa (Panaji)", "South Goa (Margao)", "Calangute", "Palolem", "Anjuna"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar", "Bikaner"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kasauli", "Spiti Valley", "Dalhousie"],
  "Uttarakhand": ["Rishikesh", "Nainital", "Dehradun", "Mussoorie", "Haridwar", "Auli"],
  "Jammu & Kashmir": ["Srinagar", "Gulmarg", "Pahalgam", "Leh", "Ladakh"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rann of Kutch", "Dwarka"],
  "Punjab": ["Amritsar", "Chandigarh", "Ludhiana"],
  "Delhi": ["New Delhi", "Central Delhi", "South Delhi"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Sundarbans"],
  "Odisha": ["Puri", "Bhubaneswar", "Cuttack"],
  "Assam": ["Guwahati", "Kaziranga", "Tezpur"],
  "Sikkim": ["Gangtok", "Pelling", "Lachung"],
};

export const DISTRICTS_BY_STATE: Record<string, string[]> = INDIAN_CITIES;

export const TOURIST_DESTINATIONS = [
  "Ooty, Tamil Nadu",
  "Kodaikanal, Tamil Nadu",
  "Munnar, Kerala",
  "Coorg, Karnataka",
  "Goa Beaches",
  "Hampi, Karnataka",
  "Mysore Palace, Karnataka",
  "Rameswaram, Tamil Nadu",
  "Kanyakumari, Tamil Nadu",
  "Mahabalipuram, Tamil Nadu",
  "Pondicherry",
  "Manali, Himachal Pradesh",
  "Leh Ladakh, Jammu & Kashmir",
  "Jaipur, Rajasthan",
  "Udaipur, Rajasthan",
  "Darjeeling, West Bengal",
  "Taj Mahal, Agra",
  "Kerala Backwaters, Alleppey",
  "Rishikesh, Uttarakhand",
];

export function getCitiesForState(state: string): string[] {
  return INDIAN_CITIES[state] || ["Main City", "Other"];
}
