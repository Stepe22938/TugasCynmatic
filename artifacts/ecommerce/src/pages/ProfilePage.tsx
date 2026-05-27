/**
 * ProfilePage.tsx
 * Profile and Settings share the same settings experience; layout switching happens inside SettingsPage.
 */
import React from "react";
import { SettingsPage } from "./SettingsPage";

export function ProfilePage() {
  return <SettingsPage />;
}

export function ProfileLayoutPage() {
  return <SettingsPage />;
}
