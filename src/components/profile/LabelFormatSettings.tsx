import { useEffect, useState } from "react";
import { Copy, Save, ScanLine, Settings } from "lucide-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
 import {
   Card,
   Button,
   TextInput,
   Select,
   Group,
   Stack,
   Text,
   SimpleGrid,
   Box,
   Divider,
   Alert,
 } from "@mantine/core";
import { useAuth, LabelFormatConfig } from "@/contexts/AuthContext";

export const PREDEFINED_FORMATS: LabelFormatConfig[] = [
 {
 id: "5160",
 name: "Avery 5160",
 unit: "in",
 sheet: { width: 8.5, height: 11 },
 label: { width: 2.625, height: 1 },
 grid: { columns: 3, rows: 10 },
 margins: { top: 0.5, bottom: 0.5, left: 0.1875, right: 0.1875 },
 gap: { horizontal: 0.125, vertical: 0 },
 },
 {
 id: "5163",
 name: "Avery 5163",
 unit: "in",
 sheet: { width: 8.5, height: 11 },
 label: { width: 4, height: 2 },
 grid: { columns: 2, rows: 5 },
 margins: { top: 0.5, bottom: 0.5, left: 0.156, right: 0.156 },
 gap: { horizontal: 0.188, vertical: 0 },
 },
 {
 id: "5167",
 name: "Avery 5167",
 unit: "in",
 sheet: { width: 8.5, height: 11 },
 label: { width: 1.75, height: 0.5 },
 grid: { columns: 4, rows: 20 },
 margins: { top: 0.5, bottom: 0.5, left: 0.3, right: 0.3 },
 gap: { horizontal: 0.3, vertical: 0 },
 },
 {
 id: "5164",
 name: "Avery 5164",
 unit: "in",
 sheet: { width: 8.5, height: 11 },
 label: { width: 4, height: 3.33 },
 grid: { columns: 2, rows: 3 },
 margins: { top: 0.5, bottom: 0.5, left: 0.156, right: 0.156 },
 gap: { horizontal: 0.188, vertical: 0 },
 },
 {
 id: "L7160",
 name: "Avery L7160",
 unit: "mm",
 sheet: { width: 210, height: 297 },
 label: { width: 63.5, height: 38.1 },
 grid: { columns: 3, rows: 7 },
 margins: { top: 15.1, bottom: 15.1, left: 7.2, right: 7.2 },
 gap: { horizontal: 2.5, vertical: 0 },
 },
];

const DEFAULT_CUSTOM_FORMAT: LabelFormatConfig = {
 id: "custom",
 name: "Custom Format",
 unit: "in",
 sheet: { width: 8.5, height: 11 },
 label: { width: 2, height: 1 },
 grid: { columns: 4, rows: 10 },
 margins: { top: 0.5, bottom: 0.5, left: 0.25, right: 0.25 },
 gap: { horizontal: 0.1, vertical: 0.1 },
};

export default function LabelFormatSettings() {
 const { profile, updateLabelFormat, isLoading } = useAuth();
 const [selectedFormatId, setSelectedFormatId] = useState<string>("5160");
 const [isSaving, setIsSaving] = useState(false);

 const form = useForm<LabelFormatConfig>({
 initialValues: DEFAULT_CUSTOM_FORMAT,
 });

 const watchCols = form.getValues().grid.columns || 1;
 const watchRows = form.getValues().grid.rows || 1;

 useEffect(() => {
 if (profile && profile.label_format && profile.label_format.id) {
 setSelectedFormatId(profile.label_format.id);
 if (profile.label_format.id === "custom") {
 form.setValues(profile.label_format);
 }
 }
 }, [profile]);

 const handleFormatSelect = (id: string | null) => {
 if (!id) return;
 setSelectedFormatId(id);
 if (id !== "custom") {
 const predefined = PREDEFINED_FORMATS.find((f) => f.id === id);
 if (predefined) {
 form.setValues(predefined);
 }
 }
 };

 const onSubmit = async (data: LabelFormatConfig) => {
 setIsSaving(true);
 try {
 let formatToSave: LabelFormatConfig;
 if (selectedFormatId === "custom") {
 formatToSave = {
 ...data,
 id: "custom",
 name: "Custom Format",
 };
 } else {
 const predefined = PREDEFINED_FORMATS.find(
 (f) => f.id === selectedFormatId
 );
 if (!predefined) throw new Error("Format not found");
 formatToSave = predefined;
 }

 const { error } = await updateLabelFormat(formatToSave);
 if (error) throw error;
 notifications.show({
 title: "Success",
 message: "Label format saved successfully.",
 color: "green",
 });
 } catch (error) {
 notifications.show({
 title: "Error",
 message:
 error instanceof Error && error.message
 ? error.message
 : "Failed to save label format.",
 color: "red",
 });
 } finally {
 setIsSaving(false);
 }
 };

 if (isLoading) return null;

 return (
 <Card className="glass-card">
 <CardHeader>
 <div className="flex items-center gap-2">
 <Settings className="h-5 w-5 text-primary" />
 <CardTitle>Label Format Settings</CardTitle>
 </div>
 <CardDescription>
 Select or define the sheet format used for printing product labels (QR
 code, description, and SKU).
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 {/* Predefined formats grid */}
 <SimpleGrid cols={{ base: 2, md: 3 }} spacing="md">
 {PREDEFINED_FORMATS.map((format) => (
 <Box
 key={format.id}
 onClick={() => handleFormatSelect(format.id)}
 className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${
 selectedFormatId === format.id
 ? "border-primary bg-primary/5"
 : "border-border hover:border-primary/50"
 }`}
 >
 <div
 className="w-16 h-20 bg-background border rounded shadow-sm p-1 grid gap-[1px]"
 style={{
 gridTemplateColumns: `repeat(${format.grid.columns}, 1fr)`,
 gridTemplateRows: `repeat(${format.grid.rows}, 1fr)`,
 }}
 >
 {Array.from({
 length: format.grid.columns * format.grid.rows,
 }).map((_, i) => (
 <div key={i} className="bg-primary/20 rounded-sm" />
 ))}
 </div>
 <div className="text-center">
 <div className="font-medium text-sm">{format.name}</div>
 <div className="text-xs text-muted-foreground">
 {format.grid.columns * format.grid.rows} labels/sheet
 </div>
 </div>
 </Box>
 ))}

 {/* Custom Format Option */}
 <Box
 onClick={() => handleFormatSelect("custom")}
 className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${
 selectedFormatId === "custom"
 ? "border-primary bg-primary/5"
 : "border-border hover:border-primary/50"
 }`}
 >
 <div className="w-16 h-20 bg-background border border-dashed rounded flex border-primary/50 text-primary items-center justify-center shadow-sm">
 <Settings className="w-6 h-6" />
 </div>
 <div className="text-center">
 <div className="font-medium text-sm">Custom</div>
 <div className="text-xs text-muted-foreground">Define your own</div>
 </div>
 </Box>
 </SimpleGrid>

 {/* Custom Format Form Extender */}
 {selectedFormatId === "custom" && (
 <div className="bg-muted/30 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-4">
 <Group justify="space-between" mb="md">
 <Text fw={500} size="sm">Custom Format Dimensions</Text>
 <Group gap="xs">
 <Text size="xs">Unit:</Text>
 <Select
 value={form.getValues().unit}
 onChange={(val) => form.setFieldValue("unit", val as "mm" | "in")}
 data={[
 { value: "in", label: "Inches" },
 { value: "mm", label: "Millimeters" },
 ]}
 className="w-24"
 />
 </Group>
 </Group>

 <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
 <TextInput
 label="Sheet Width"
 type="number"
 step="0.01"
 {...form.getInputProps("sheet.width")}
 />
 <TextInput
 label="Sheet Height"
 type="number"
 step="0.01"
 {...form.getInputProps("sheet.height")}
 />
 <TextInput
 label="Label Width"
 type="number"
 step="0.01"
 {...form.getInputProps("label.width")}
 />
 <TextInput
 label="Label Height"
 type="number"
 step="0.01"
 {...form.getInputProps("label.height")}
 />
 <TextInput
 label="Columns"
 type="number"
 {...form.getInputProps("grid.columns")}
 />
 <TextInput
 label="Rows"
 type="number"
 {...form.getInputProps("grid.rows")}
 />
 <TextInput
 label="Top Margin"
 type="number"
 step="0.01"
 {...form.getInputProps("margins.top")}
 />
 <TextInput
 label="Bottom Margin"
 type="number"
 step="0.01"
 {...form.getInputProps("margins.bottom")}
 />
 <TextInput
 label="Left Margin"
 type="number"
 step="0.01"
 {...form.getInputProps("margins.left")}
 />
 <TextInput
 label="Right Margin"
 type="number"
 step="0.01"
 {...form.getInputProps("margins.right")}
 />
 <TextInput
 label="Horizontal Gap"
 type="number"
 step="0.01"
 {...form.getInputProps("gap.horizontal")}
 />
 <TextInput
 label="Vertical Gap"
 type="number"
 step="0.01"
 {...form.getInputProps("gap.vertical")}
 />
 </SimpleGrid>

 <Alert variant="light" color="blue" className="inline-block">
 Calculated Labels Per Sheet: {watchCols * watchRows}
 </Alert>
 </div>
 )}

 {/* Read Only Visual Information */}
 <Group className="flex flex-col md:flex-row gap-4 items-center bg-muted/20 p-4 rounded border">
 <Stack flex={1} gap={2}>
 <Text fw={600} size="sm">Label Content Overview</Text>
 <Text size="xs" c="dimmed" className="w-[90%] md:w-full">
 Every printed label will automatically include the item's QR code,
 SKU, and short description to optimize scanning workflows.
 </Text>
 </Stack>
 <Box className="w-48 h-24 shrink-0 bg-background border shadow-sm flex items-center p-2 gap-3 rounded overflow-hidden">
 <Box className="w-16 h-16 shrink-0 bg-muted rounded flex items-center justify-center">
 <ScanLine className="w-8 h-8 text-muted-foreground" />
 </Box>
 <Stack flex={1} justify="center" align="center" gap={2}>
 <Box className="h-3 bg-muted rounded w-3/4 mb-1"></Box>
 <Box className="h-2 bg-muted rounded w-full"></Box>
 <Box className="h-2 bg-muted rounded w-2/3"></Box>
 </Stack>
 </Box>
 </Group>

 <Divider my="md" />
 <Group justify="end">
 <Button onClick={form.onSubmit(onSubmit)} loading={isSaving} leftSection={<Save size={16} />}>
 {isSaving ? "Saving..." : "Save Label Settings"}
 </Button>
 </Group>
 </CardContent>
 </Card>
 );
}
