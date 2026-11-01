import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import App from "./App.tsx";
import Error from "./pages/Error.tsx";
import { theme } from './theme';

const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <MantineProvider theme={theme}>
        <Notifications />
        <App />
      </MantineProvider>
    ),
    errorElement: <Error />,
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);