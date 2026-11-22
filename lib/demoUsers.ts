export type DemoRole = "admin" | "scientist" | "lab_technician";

export interface DemoUser {
  role: DemoRole;
  label: string;
  name: string;
  email: string;
  password: string;
}

// Demo accounts shown on the login page. They are created in the database
// automatically the first time someone signs in with them.
export const DEMO_USERS: DemoUser[] = [
  {
    role: "admin",
    label: "Admin",
    name: "Demo Admin",
    email: "demo.admin@lab.com",
    password: "DemoAdmin123",
  },
  {
    role: "scientist",
    label: "Scientist",
    name: "Demo Scientist",
    email: "demo.scientist@lab.com",
    password: "DemoScientist123",
  },
  {
    role: "lab_technician",
    label: "Lab Technician",
    name: "Demo Lab Technician",
    email: "demo.labtech@lab.com",
    password: "DemoLabTech123",
  },
];

export function findDemoUser(email: string, password: string) {
  return DEMO_USERS.find((u) => u.email === email && u.password === password);
}
