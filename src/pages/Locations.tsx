import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button, Card, TextInput, Switch, Table, Badge, Skeleton, Modal, Text, Group, Stack, ActionIcon } from "@mantine/core";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/hooks/useInventory";
import type { Location } from "@/types/inventory";
import { useCanWrite } from "@/hooks/useCanWrite";

function LocationForm({
  location,
  onSubmit,
  onClose,
}: {
  location?: Location;
  onSubmit: (data: { name: string; address: string; is_active: boolean }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(location?.name ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [isActive, setIsActive] = useState(location?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), address: address.trim(), is_active: isActive });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main Warehouse"
          required
        />
        <TextInput
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Industrial Blvd"
        />
        <Switch
          label="Active"
          checked={isActive}
          onChange={(e) => setIsActive(e.currentTarget.checked)}
        />
        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="default" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {location ? "Update" : "Create"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export default function Locations() {
  const { data: locations, isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const { canWrite } = useCanWrite();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [search, setSearch] = useState("");

  const filtered = (locations ?? []).filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.address ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = () => {
    setEditingLocation(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (loc: Location) => {
    setEditingLocation(loc);
    setDialogOpen(true);
  };

  const handleSubmit = (data: { name: string; address: string; is_active: boolean }) => {
    if (editingLocation) {
      updateLocation.mutate({ id: editingLocation.id, ...data });
    } else {
      createLocation.mutate({ name: data.name, address: data.address || null });
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteLocation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <div>
          <Text size="xl" fw={700} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={24} color="var(--mantine-color-teal-6)" />
            Locations
          </Text>
          <Text size="sm" c="dimmed">Manage warehouses and storage locations</Text>
        </div>
        {canWrite && (
          <Button onClick={handleCreate} leftSection={<Plus size={16} />}>
            Add Location
          </Button>
        )}
      </Group>

      <Card withBorder padding="md">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Text size="lg" fw={500}>All Locations</Text>
            <TextInput
              placeholder="Search locations..."
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              w={256}
            />
          </Group>
          
          {isLoading ? (
            <Stack gap="xs">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={48} />
              ))}
            </Stack>
          ) : filtered.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              {search ? "No locations match your search." : "No locations yet. Add one to get started."}
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Address</Table.Th>
                  <Table.Th>Status</Table.Th>
                  {canWrite && <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((loc) => (
                  <Table.Tr key={loc.id}>
                    <Table.Td fw={500}>{loc.name}</Table.Td>
                    <Table.Td>{loc.address || "—"}</Table.Td>
                    <Table.Td>
                      <Badge color={loc.is_active ? "teal" : "gray"}>
                        {loc.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Td>
                    {canWrite && (
                      <Table.Td style={{ textAlign: "right" }}>
                        <Group gap="xs" justify="flex-end">
                          <ActionIcon variant="subtle" onClick={() => handleEdit(loc)}>
                            <Pencil size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(loc)}>
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>

      <Modal opened={dialogOpen} onClose={() => setDialogOpen(false)} title={editingLocation ? "Edit Location" : "Add Location"}>
        <LocationForm
          location={editingLocation}
          onSubmit={handleSubmit}
          onClose={() => setDialogOpen(false)}
        />
      </Modal>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Location">
        <Stack gap="md">
          <Text>
            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button color="red" onClick={confirmDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}