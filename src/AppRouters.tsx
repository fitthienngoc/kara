import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { NotFound } from "./pages";
import { VideoEditorApp } from "./VideoEditorApp";

// Định nghĩa các routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <VideoEditorApp />,
    errorElement: <NotFound />,
  },
]);

// Component Router
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
