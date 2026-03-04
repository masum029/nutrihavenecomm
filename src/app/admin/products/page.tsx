'use client';

import NextImage from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Product, SectionAd } from "@/types";

type TaxonomyStore = {
  categories: string[];
  subcategories: { name: string; category: string }[];
  brands: string[];
};

type TaxonomyType = "category" | "subcategory" | "brand";
type ModalMode = "create" | "edit" | "delete";

type ModalState = {
  open: boolean;
  mode: ModalMode;
  type: TaxonomyType;
  name: string;
  newName: string;
  category: string;
  newCategory: string;
};

const initialModalState: ModalState = {
  open: false,
  mode: "create",
  type: "category",
  name: "",
  newName: "",
  category: "",
  newCategory: "",
};

const STANDARD_IMAGE_QUALITY = 0.8;
const STANDARD_IMAGE_MAX_DIMENSION = 1600;

const makeDefaultOfferEnd = () => {
  const date = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const addDaysToDateTimeLocal = (days: number) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toDateTimeLocal = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return makeDefaultOfferEnd();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [taxonomies, setTaxonomies] = useState<TaxonomyStore>({ categories: [], subcategories: [], brands: [] });
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [compressionNote, setCompressionNote] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [uploadStorageReady, setUploadStorageReady] = useState<boolean | null>(null);
  const [uploadStorageMode, setUploadStorageMode] = useState<string>("");
  const [uploadStorageMessage, setUploadStorageMessage] = useState("Checking upload storage status...");
  const isUploadBlocked = uploadStorageReady === false;

  const [error, setError] = useState("");

  const [searchName, setSearchName] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchBrand, setSearchBrand] = useState("all");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editUploadError, setEditUploadError] = useState("");
  const [editCompressionNote, setEditCompressionNote] = useState("");
  const [editIsDragOver, setEditIsDragOver] = useState(false);

  const [modal, setModal] = useState<ModalState>(initialModalState);
  const [modalError, setModalError] = useState("");

  const [sectionAds, setSectionAds] = useState<SectionAd[]>([]);
  const [sectionAdSection, setSectionAdSection] = useState("");
  const [sectionAdImage, setSectionAdImage] = useState("");
  const [sectionAdOfferEndsAt, setSectionAdOfferEndsAt] = useState(makeDefaultOfferEnd());
  const [sectionAdUploading, setSectionAdUploading] = useState(false);
  const [sectionAdUploadProgress, setSectionAdUploadProgress] = useState(0);
  const [sectionAdUploadError, setSectionAdUploadError] = useState("");
  const [sectionAdError, setSectionAdError] = useState("");
  const [sectionAdSaving, setSectionAdSaving] = useState(false);

  const loadSectionAds = useCallback(async () => {
    const response = await fetch("/api/section-ads");
    const data = await response.json();
    setSectionAds(data.data?.items ?? []);
  }, []);

  const loadTaxonomies = useCallback(async () => {
    const response = await fetch("/api/taxonomies");
    const data = await response.json();
    const next = data.data as TaxonomyStore;
    setTaxonomies(next);

    setCategory((prevCategory) => {
      if (prevCategory || next.categories.length === 0) return prevCategory;
      const defaultCategory = next.categories[0];
      const matchedSub = next.subcategories.find((item) => item.category === defaultCategory)?.name ?? "";
      setSubcategory((prevSubcategory) => prevSubcategory || matchedSub);
      return defaultCategory;
    });

    setBrand((prevBrand) => prevBrand || next.brands[0] || "");
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/products?limit=100");
    const data = await response.json();
    setProducts(data.data.items ?? []);
  }, []);

  const loadUploadStorageHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health/upload-storage", { cache: "no-store" });
      const body = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: { mode?: string; ready?: boolean };
      };

      const ready = typeof body?.data?.ready === "boolean" ? body.data.ready : response.ok;
      setUploadStorageReady(ready);
      setUploadStorageMode(body?.data?.mode ?? "");
      setUploadStorageMessage(body?.message ?? (ready ? "Upload storage is ready." : "Upload storage is not ready."));
    } catch {
      setUploadStorageReady(false);
      setUploadStorageMode("");
      setUploadStorageMessage("Unable to verify upload storage status right now.");
    }
  }, []);

  useEffect(() => {
    load();
    loadTaxonomies();
    loadSectionAds();
    loadUploadStorageHealth();
  }, [load, loadTaxonomies, loadSectionAds, loadUploadStorageHealth]);

  useEffect(() => {
    if (!sectionAdSection && taxonomies.categories.length > 0) {
      setSectionAdSection(taxonomies.categories[0]);
    }
  }, [sectionAdSection, taxonomies.categories]);

  useEffect(() => {
    if (!sectionAdSection) return;
    const existing = sectionAds.find((item) => item.section.toLowerCase() === sectionAdSection.toLowerCase());
    if (!existing) return;

    setSectionAdOfferEndsAt(toDateTimeLocal(existing.offerEndsAt));
    setSectionAdImage(existing.image);
  }, [sectionAdSection, sectionAds]);

  useEffect(() => {
    const matched = taxonomies.subcategories.filter((item) => item.category === category);
    if (matched.length === 0) {
      setSubcategory("");
      return;
    }
    if (!matched.some((item) => item.name === subcategory)) {
      setSubcategory(matched[0].name);
    }
  }, [category, subcategory, taxonomies.subcategories]);

  const readResponseMessage = async (response: Response, fallback: string) => {
    try {
      const data = (await response.json()) as { message?: string };
      return data.message ?? fallback;
    } catch {
      return fallback;
    }
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (creatingProduct) return;

    if (uploadingImage) {
      setError("Please wait until image upload is complete.");
      return;
    }

    const finalImagePath = imagePath || manualImageUrl.trim();
    if (!finalImagePath) {
      setError("Please upload an image or provide a valid image URL.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      category,
      subcategory,
      brand,
      image: finalImagePath,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      discountType: formData.get("discountType") || undefined,
      discountValue: Number(formData.get("discountValue") || 0),
      flags: {
        trending: formData.get("trending") === "on",
        ramadanExclusive: formData.get("ramadanExclusive") === "on",
        bestSell: formData.get("bestSell") === "on",
      },
    };

    setCreatingProduct(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(await readResponseMessage(response, "Failed to create product"));
        return;
      }

      form.reset();
      setImagePath("");
      setManualImageUrl("");
      setUploadError("");
      setUploadProgress(0);
      setCompressionNote("");
      await load();
    } catch {
      setError("Unable to create product right now. Please try again.");
    } finally {
      setCreatingProduct(false);
    }
  };

  const onImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (isUploadBlocked) {
      setUploadError(uploadStorageMessage || "Upload storage is not ready.");
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    await uploadImage(file);
    event.target.value = "";
  };

  const compressImageOnClient = async (file: File) => {
    if (!file.type.startsWith("image/")) return file;
    if (file.type === "image/gif") {
      setCompressionNote("GIF is uploaded without compression to preserve animation.");
      return file;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image for compression."));
        img.src = objectUrl;
      });

      const width = image.width;
      const height = image.height;
      const scale = Math.min(1, STANDARD_IMAGE_MAX_DIMENSION / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available.");

      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      const outputType =
        file.type === "image/png"
          ? "image/png"
          : file.type === "image/webp"
            ? "image/webp"
            : "image/jpeg";

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outputType, STANDARD_IMAGE_QUALITY);
      });

      if (!blob) throw new Error("Compression failed.");

      const extension = outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg";
      const fileName = file.name.replace(/\.[^.]+$/, "") + `.${extension}`;
      return new File([blob], fileName, { type: outputType });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }

    setUploadError("");
    setCompressionNote("");
    setUploadingImage(true);
    setUploadProgress(0);

    let fileToUpload = file;
    try {
      const compressed = await compressImageOnClient(file);
      fileToUpload = compressed;
      const originalKb = (file.size / 1024).toFixed(1);
      const compressedKb = (compressed.size / 1024).toFixed(1);
      setCompressionNote(`Standardized upload: ${originalKb}KB → ${compressedKb}KB (max ${STANDARD_IMAGE_MAX_DIMENSION}px, ${Math.round(STANDARD_IMAGE_QUALITY * 100)}% quality)`);
    } catch {
      setCompressionNote("Standard image optimization skipped due to processing issue.");
    }

    const data = new FormData();
    data.append("file", fileToUpload);

    const result = await new Promise<{ ok: boolean; status: number; body: unknown }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads/product-image");

      xhr.upload.onprogress = (progressEvent) => {
        if (!progressEvent.lengthComputable) return;
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setUploadProgress(percent);
      };

      xhr.onload = () => {
        let parsed: unknown = {};
        try {
          parsed = JSON.parse(xhr.responseText || "{}");
        } catch {
          parsed = {};
        }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: parsed });
      };

      xhr.onerror = () => resolve({ ok: false, status: 500, body: { message: "Network upload error." } });
      xhr.send(data);
    });

    setUploadingImage(false);
    if (!result.ok) {
      const body = result.body as { message?: string };
      const defaultMessage =
        result.status === 401 || result.status === 403
          ? "Admin authorization required. Please login again."
          : "Image upload failed.";
      setUploadError(body?.message ?? defaultMessage);
      setUploadProgress(0);
      return;
    }

    const body = result.body as { data?: { url?: string } };
    const url = body?.data?.url ?? "";
    if (!url) {
      setUploadError("Upload completed but image URL was missing.");
      setUploadProgress(0);
      return;
    }

    setImagePath(url);
    setUploadProgress(100);
  };

  const onDropImage = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    if (isUploadBlocked) {
      setUploadError(uploadStorageMessage || "Upload storage is not ready.");
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  const uploadEditImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setEditUploadError("Please select a valid image file.");
      return;
    }

    setEditUploadError("");
    setEditCompressionNote("");
    setEditUploadingImage(true);
    setEditUploadProgress(0);

    let fileToUpload = file;
    try {
      const compressed = await compressImageOnClient(file);
      fileToUpload = compressed;
      const originalKb = (file.size / 1024).toFixed(1);
      const compressedKb = (compressed.size / 1024).toFixed(1);
      setEditCompressionNote(`Standardized upload: ${originalKb}KB → ${compressedKb}KB (max ${STANDARD_IMAGE_MAX_DIMENSION}px, ${Math.round(STANDARD_IMAGE_QUALITY * 100)}% quality)`);
    } catch {
      setEditCompressionNote("Standard image optimization skipped due to processing issue.");
    }

    const data = new FormData();
    data.append("file", fileToUpload);

    const result = await new Promise<{ ok: boolean; status: number; body: unknown }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads/product-image");

      xhr.upload.onprogress = (progressEvent) => {
        if (!progressEvent.lengthComputable) return;
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setEditUploadProgress(percent);
      };

      xhr.onload = () => {
        let parsed: unknown = {};
        try {
          parsed = JSON.parse(xhr.responseText || "{}");
        } catch {
          parsed = {};
        }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: parsed });
      };

      xhr.onerror = () => resolve({ ok: false, status: 500, body: { message: "Network upload error." } });
      xhr.send(data);
    });

    setEditUploadingImage(false);
    if (!result.ok) {
      const body = result.body as { message?: string };
      setEditUploadError(body?.message ?? "Image upload failed.");
      setEditUploadProgress(0);
      return;
    }

    const body = result.body as { data?: { url?: string } };
    const url = body?.data?.url ?? "";
    if (!url) {
      setEditUploadError("Upload completed but image URL was missing.");
      setEditUploadProgress(0);
      return;
    }

    setEditingProduct((prev) => (prev ? { ...prev, image: url } : prev));
    setEditUploadProgress(100);
  };

  const onEditImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (isUploadBlocked) {
      setEditUploadError(uploadStorageMessage || "Upload storage is not ready.");
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;
    await uploadEditImage(file);
  };

  const onEditDropImage = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setEditIsDragOver(false);

    if (isUploadBlocked) {
      setEditUploadError(uploadStorageMessage || "Upload storage is not ready.");
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await uploadEditImage(file);
  };

  const openCreateModal = (type: TaxonomyType) => {
    setModal({
      open: true,
      mode: "create",
      type,
      name: "",
      newName: "",
      category: category || taxonomies.categories[0] || "",
      newCategory: category || taxonomies.categories[0] || "",
    });
    setModalError("");
  };

  const openEditModal = (type: TaxonomyType, name: string, itemCategory?: string) => {
    setModal({
      open: true,
      mode: "edit",
      type,
      name,
      newName: name,
      category: itemCategory ?? "",
      newCategory: itemCategory ?? (category || ""),
    });
    setModalError("");
  };

  const openDeleteModal = (type: TaxonomyType, name: string, itemCategory?: string) => {
    setModal({
      open: true,
      mode: "delete",
      type,
      name,
      newName: "",
      category: itemCategory ?? "",
      newCategory: "",
    });
    setModalError("");
  };

  const closeModal = () => {
    setModal(initialModalState);
    setModalError("");
  };

  const submitModal = async () => {
    if (!modal.open) return;
    setModalError("");

    let endpointMethod: "POST" | "PATCH" | "DELETE" = "POST";
    let payload: Record<string, unknown> = {};

    if (modal.mode === "create") {
      endpointMethod = "POST";
      payload = {
        type: modal.type,
        name: modal.newName,
        category: modal.type === "subcategory" ? modal.category : undefined,
      };
    }

    if (modal.mode === "edit") {
      endpointMethod = "PATCH";
      payload = {
        type: modal.type,
        name: modal.name,
        newName: modal.newName,
        category: modal.type === "subcategory" ? modal.category : undefined,
        newCategory: modal.type === "subcategory" ? modal.newCategory : undefined,
      };
    }

    if (modal.mode === "delete") {
      endpointMethod = "DELETE";
      payload = {
        type: modal.type,
        name: modal.name,
        category: modal.type === "subcategory" ? modal.category : undefined,
      };
    }

    const response = await fetch("/api/taxonomies", {
      method: endpointMethod,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setModalError(data.message ?? "Failed to create.");
      return;
    }

    await loadTaxonomies();

    if (modal.mode !== "delete") {
      const selectedName = modal.newName.trim();
      if (modal.type === "category" && selectedName) setCategory(selectedName);
      if (modal.type === "brand" && selectedName) setBrand(selectedName);
      if (modal.type === "subcategory" && selectedName) {
        const targetCategory = modal.mode === "edit" ? modal.newCategory : modal.category;
        setCategory(targetCategory || category);
        setSubcategory(selectedName);
      }
    }

    closeModal();
  };

  const filteredSubcategories = taxonomies.subcategories.filter((item) => item.category === category);

  const editSubcategories = useMemo(() => {
    if (!editingProduct) return [];
    return taxonomies.subcategories.filter((item) => item.category === editingProduct.category);
  }, [editingProduct, taxonomies.subcategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const byName = !searchName || product.name.toLowerCase().includes(searchName.toLowerCase());
      const byCategory = searchCategory === "all" || product.category === searchCategory;
      const byBrand = searchBrand === "all" || product.brand === searchBrand;
      return byName && byCategory && byBrand;
    });
  }, [products, searchName, searchCategory, searchBrand]);

  const sectionEntryOptions = useMemo(() => {
    const values = new Set<string>();
    taxonomies.categories.forEach((item) => values.add(item));
    sectionAds.forEach((item) => values.add(item.section));
    return [...values];
  }, [taxonomies.categories, sectionAds]);

  const onDeleteProduct = async (id: string) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Failed to delete product");
      return;
    }
    await load();
  };

  const onEditProduct = (product: Product) => {
    setEditError("");
    setEditUploadError("");
    setEditCompressionNote("");
    setEditUploadProgress(0);
    setEditUploadingImage(false);
    setEditingProduct(product);
  };

  const uploadSectionAdImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSectionAdUploadError("Please select a valid image file.");
      return;
    }

    setSectionAdUploading(true);
    setSectionAdUploadProgress(0);
    setSectionAdUploadError("");

    const data = new FormData();
    data.append("file", file);

    const result = await new Promise<{ ok: boolean; status: number; body: unknown }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads/section-banner-image");

      xhr.upload.onprogress = (progressEvent) => {
        if (!progressEvent.lengthComputable) return;
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setSectionAdUploadProgress(percent);
      };

      xhr.onload = () => {
        let parsed: unknown = {};
        try {
          parsed = JSON.parse(xhr.responseText || "{}");
        } catch {
          parsed = {};
        }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: parsed });
      };

      xhr.onerror = () => resolve({ ok: false, status: 500, body: { message: "Network upload error." } });
      xhr.send(data);
    });

    setSectionAdUploading(false);
    if (!result.ok) {
      const body = result.body as { message?: string };
      setSectionAdUploadError(body?.message ?? "Banner image upload failed.");
      setSectionAdUploadProgress(0);
      return;
    }

    const body = result.body as { data?: { url?: string } };
    const url = body?.data?.url ?? "";
    if (!url) {
      setSectionAdUploadError("Upload completed but image URL was missing.");
      setSectionAdUploadProgress(0);
      return;
    }

    setSectionAdImage(url);
    setSectionAdUploadProgress(100);
  };

  const onSectionAdImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (isUploadBlocked) {
      setSectionAdUploadError(uploadStorageMessage || "Upload storage is not ready.");
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;
    await uploadSectionAdImage(file);
  };

  const saveSectionAd = async () => {
    setSectionAdError("");

    if (!sectionAdSection) {
      setSectionAdError("Please select a section.");
      return;
    }
    if (!sectionAdImage) {
      setSectionAdError("Please upload a banner image.");
      return;
    }
    if (!sectionAdOfferEndsAt) {
      setSectionAdError("Please set offer end date/time.");
      return;
    }

    setSectionAdSaving(true);
    const response = await fetch("/api/section-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: sectionAdSection,
        image: sectionAdImage,
        offerEndsAt: new Date(sectionAdOfferEndsAt).toISOString(),
      }),
    });
    setSectionAdSaving(false);

    if (!response.ok) {
      const data = await response.json();
      setSectionAdError(data.message ?? "Failed to save section advertisement.");
      return;
    }

    setSectionAdImage("");
    setSectionAdOfferEndsAt(makeDefaultOfferEnd());
    await loadSectionAds();
  };

  const removeSectionAd = async (id: string) => {
    const confirmed = window.confirm("Delete this section advertisement?");
    if (!confirmed) return;

    const response = await fetch("/api/section-ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const data = await response.json();
      setSectionAdError(data.message ?? "Failed to delete section advertisement.");
      return;
    }

    await loadSectionAds();
  };

  const onSaveEditProduct = async () => {
    if (!editingProduct) return;
    setSavingEdit(true);
    setEditError("");

    const payload = {
      name: editingProduct.name,
      description: editingProduct.description,
      category: editingProduct.category,
      subcategory: editingProduct.subcategory,
      brand: editingProduct.brand,
      image: editingProduct.image,
      price: Number(editingProduct.price),
      stock: Number(editingProduct.stock),
      discountType: editingProduct.discountType || undefined,
      discountValue: Number(editingProduct.discountValue || 0),
      flags: editingProduct.flags,
    };

    const response = await fetch(`/api/products/${editingProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingEdit(false);
    if (!response.ok) {
      const data = await response.json();
      setEditError(data.message ?? "Failed to update product");
      return;
    }

    setEditingProduct(null);
    await load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold">Admin Product Management</h1>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          uploadStorageReady === null
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : uploadStorageReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        <p className="font-semibold">Upload Storage Status</p>
        <p>{uploadStorageMessage}</p>
        {uploadStorageMode && <p className="text-xs mt-1">Mode: {uploadStorageMode}</p>}
      </div>

      <form onSubmit={createProduct} className="bg-white border border-emerald-100 rounded-xl p-5 space-y-4">
        <div className="sm:col-span-2 border rounded p-3">
          <p className="text-sm font-semibold mb-1">Step 1: Upload Product Image</p>
          <p className="text-xs text-gray-500 mb-3">
            No minimum resolution required. Images are auto-optimized to standard quality ({Math.round(STANDARD_IMAGE_QUALITY * 100)}%)
            and max {STANDARD_IMAGE_MAX_DIMENSION}px during upload.
          </p>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Or paste image URL</label>
            <input
              type="url"
              value={manualImageUrl}
              onChange={(event) => {
                setManualImageUrl(event.target.value);
                if (event.target.value.trim()) {
                  setImagePath("");
                  setUploadError("");
                }
              }}
              placeholder="https://example.com/product-image.jpg"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div
            onDragOver={(event) => {
              if (isUploadBlocked) return;
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDropImage}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isUploadBlocked ? "border-gray-200 bg-gray-50 opacity-60" : isDragOver ? "border-primary bg-emerald-50" : "border-emerald-200"
            }`}
          >
            <p className="text-sm text-gray-700 mb-2">
              {isUploadBlocked ? "Upload is disabled until storage is ready." : "Drag & drop image here or select file"}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              disabled={isUploadBlocked}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {uploadingImage && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Uploading image... {uploadProgress}%</p>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
          {compressionNote && <p className="text-sm text-emerald-700 mt-2">{compressionNote}</p>}
          {(imagePath || manualImageUrl.trim()) && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Selected image: {imagePath || manualImageUrl.trim()}</p>
              <NextImage
                src={imagePath || manualImageUrl.trim()}
                alt="Selected product"
                width={112}
                height={112}
                className="h-28 w-28 object-cover rounded border"
              />
            </div>
          )}
        </div>

        <div className="border rounded p-3">
          <p className="text-sm font-semibold mb-3">Step 2: Product Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="name" required placeholder="Name" className="border rounded px-3 py-2" />
            <div className="flex gap-2">
              <select
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="border rounded px-3 py-2 flex-1"
                required
              >
                <option value="">Select Brand</option>
                {taxonomies.brands.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => openCreateModal("brand")}>+ Brand</button>
            </div>

            <div className="flex gap-2">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="border rounded px-3 py-2 flex-1"
                required
              >
                <option value="">Select Category</option>
                {taxonomies.categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => openCreateModal("category")}>+ Category</button>
            </div>

            <div className="flex gap-2">
              <select
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
                className="border rounded px-3 py-2 flex-1"
                required
              >
                <option value="">Select Subcategory</option>
                {filteredSubcategories.map((item) => (
                  <option key={`${item.category}-${item.name}`} value={item.name}>{item.name}</option>
                ))}
              </select>
              <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => openCreateModal("subcategory")}>+ Subcategory</button>
            </div>

            <textarea name="description" required placeholder="Description" className="border rounded px-3 py-2 sm:col-span-2" />
          </div>
        </div>

        <div className="border rounded p-3">
          <p className="text-sm font-semibold mb-3">Step 3: Pricing, Stock & Flags</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="price" type="number" step="0.01" required placeholder="Price" className="border rounded px-3 py-2" />
            <input name="stock" type="number" required placeholder="Stock" className="border rounded px-3 py-2" />
            <select name="discountType" className="border rounded px-3 py-2">
              <option value="">No discount</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input name="discountValue" type="number" step="0.01" placeholder="Discount value" className="border rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <label className="text-sm flex items-center gap-2"><input type="checkbox" name="trending" /> Trending</label>
            <label className="text-sm flex items-center gap-2"><input type="checkbox" name="ramadanExclusive" /> Ramadan Exclusive</label>
            <label className="text-sm flex items-center gap-2"><input type="checkbox" name="bestSell" /> Best Sell</label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={creatingProduct || uploadingImage} className="btn-primary disabled:opacity-50">
          {creatingProduct ? "Creating..." : uploadingImage ? "Uploading image..." : "Create Product"}
        </button>
      </form>

      <div className="bg-white border border-emerald-100 rounded-xl p-5">
        <h2 className="text-xl font-bold mb-4">Category, Subcategory & Brand Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Categories</h3>
              <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => openCreateModal("category")}>+ Add</button>
            </div>
            <div className="space-y-2">
              {taxonomies.categories.map((item) => (
                <div key={item} className="flex items-center justify-between border rounded px-2 py-1 text-sm">
                  <span>{item}</span>
                  <div className="flex gap-1">
                    <button type="button" className="btn bg-gray-100 text-gray-700" onClick={() => openEditModal("category", item)}>Edit</button>
                    <button type="button" className="btn bg-red-100 text-red-700" onClick={() => openDeleteModal("category", item)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Subcategories</h3>
              <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => openCreateModal("subcategory")}>+ Add</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {taxonomies.subcategories.map((item) => (
                <div key={`${item.category}-${item.name}`} className="border rounded px-2 py-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500 mb-1">{item.category}</p>
                  <div className="flex gap-1">
                    <button type="button" className="btn bg-gray-100 text-gray-700" onClick={() => openEditModal("subcategory", item.name, item.category)}>Edit</button>
                    <button type="button" className="btn bg-red-100 text-red-700" onClick={() => openDeleteModal("subcategory", item.name, item.category)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Brands</h3>
              <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => openCreateModal("brand")}>+ Add</button>
            </div>
            <div className="space-y-2">
              {taxonomies.brands.map((item) => (
                <div key={item} className="flex items-center justify-between border rounded px-2 py-1 text-sm">
                  <span>{item}</span>
                  <div className="flex gap-1">
                    <button type="button" className="btn bg-gray-100 text-gray-700" onClick={() => openEditModal("brand", item)}>Edit</button>
                    <button type="button" className="btn bg-red-100 text-red-700" onClick={() => openDeleteModal("brand", item)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-emerald-100 rounded-xl p-5">
        <h2 className="text-xl font-bold mb-4">Section Advertisement & Offer Timer</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            value={sectionAdSection}
            onChange={(event) => setSectionAdSection(event.target.value)}
            placeholder="Section entry (e.g. Ramadan, Vegetables)"
            list="section-entry-options"
            className="border rounded px-3 py-2"
          />

          <input
            type="datetime-local"
            value={sectionAdOfferEndsAt}
            onChange={(event) => setSectionAdOfferEndsAt(event.target.value)}
            className="border rounded px-3 py-2"
          />

          <button
            type="button"
            className="btn-primary"
            onClick={saveSectionAd}
            disabled={sectionAdSaving || sectionAdUploading}
          >
            {sectionAdSaving ? "Saving..." : "Save / Update Section Ad"}
          </button>
        </div>

        <datalist id="section-entry-options">
          {sectionEntryOptions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs text-gray-600">Use section entry to create a new section ad, or click Edit on an existing one.</p>
          <button
            type="button"
            className="btn bg-gray-100 text-gray-700"
            onClick={() => {
              setSectionAdSection("");
              setSectionAdImage("");
              setSectionAdOfferEndsAt(makeDefaultOfferEnd());
              setSectionAdError("");
            }}
          >
            Clear Form
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-600">Quick Offer Time:</span>
          <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => setSectionAdOfferEndsAt(addDaysToDateTimeLocal(3))}>+3 Days</button>
          <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => setSectionAdOfferEndsAt(addDaysToDateTimeLocal(7))}>+7 Days</button>
          <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => setSectionAdOfferEndsAt(addDaysToDateTimeLocal(15))}>+15 Days</button>
          <button type="button" className="btn bg-emerald-100 text-primary" onClick={() => setSectionAdOfferEndsAt(addDaysToDateTimeLocal(30))}>+30 Days</button>
        </div>

        <div className="border rounded p-3 mb-3">
          <label className="block text-sm font-medium mb-2">Banner Image Upload</label>
          <input
            type="file"
            accept="image/*"
            onChange={onSectionAdImageSelect}
            disabled={isUploadBlocked}
            className="w-full border rounded px-3 py-2"
          />

          {sectionAdUploading && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Uploading banner... {sectionAdUploadProgress}%</p>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${sectionAdUploadProgress}%` }} />
              </div>
            </div>
          )}

          {sectionAdUploadError && <p className="text-sm text-red-600 mt-2">{sectionAdUploadError}</p>}

          {sectionAdImage && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Uploaded: {sectionAdImage}</p>
              <NextImage src={sectionAdImage} alt="Section ad banner" width={640} height={96} className="h-24 w-full max-w-md rounded border object-cover" />
            </div>
          )}
        </div>

        {sectionAdError && <p className="text-sm text-red-600 mb-3">{sectionAdError}</p>}

        <div className="space-y-3">
          {sectionAds.map((item) => (
            <div key={item.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold">{item.section}</p>
                <p className="text-xs text-gray-500">Offer ends: {new Date(item.offerEndsAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn bg-emerald-100 text-primary"
                  onClick={() => {
                    setSectionAdSection(item.section);
                    setSectionAdOfferEndsAt(toDateTimeLocal(item.offerEndsAt));
                    setSectionAdImage(item.image);
                  }}
                >
                  Edit Section Ad
                </button>
                <NextImage src={item.image} alt={item.section} width={112} height={56} className="h-14 w-28 rounded border object-cover" />
                <button type="button" className="btn bg-red-100 text-red-700" onClick={() => removeSectionAd(item.id)}>Delete</button>
              </div>
            </div>
          ))}

          {sectionAds.length === 0 && <p className="text-sm text-gray-600">No section advertisement configured yet.</p>}
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-emerald-100 p-5">
            <h2 className="text-xl font-bold mb-4 capitalize">{modal.mode} {modal.type}</h2>

            {modal.type === "subcategory" && (modal.mode === "create" || modal.mode === "edit") && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Current Category</label>
                  <select
                    value={modal.category}
                    onChange={(event) => setModal((prev) => ({ ...prev, category: event.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {taxonomies.categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                {modal.mode === "edit" && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">New Category</label>
                    <select
                      value={modal.newCategory}
                      onChange={(event) => setModal((prev) => ({ ...prev, newCategory: event.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      {taxonomies.categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {(modal.mode === "create" || modal.mode === "edit") && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={modal.newName}
                  onChange={(event) => setModal((prev) => ({ ...prev, newName: event.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder={`Enter ${modal.type} name`}
                />
              </div>
            )}

            {modal.mode === "delete" && (
              <p className="text-sm text-gray-700 mb-3">
                Confirm delete for <span className="font-semibold">{modal.name}</span>
                {modal.type === "subcategory" && modal.category ? ` in ${modal.category}` : ""}.
              </p>
            )}

            {modalError && <p className="text-sm text-red-600 mb-3">{modalError}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn bg-gray-100 text-gray-700" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" onClick={submitModal}>
                {modal.mode === "create" ? "Create" : modal.mode === "edit" ? "Update" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-emerald-100 p-5 max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Update Product</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={editingProduct.name}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, name: event.target.value }) : prev)}
                placeholder="Name"
                className="border rounded px-3 py-2"
              />
              <input
                value={editingProduct.brand}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, brand: event.target.value }) : prev)}
                placeholder="Brand"
                className="border rounded px-3 py-2"
                list="brand-options"
              />

              <select
                value={editingProduct.category}
                onChange={(event) =>
                  setEditingProduct((prev) =>
                    prev
                      ? {
                          ...prev,
                          category: event.target.value,
                          subcategory:
                            taxonomies.subcategories.find((item) => item.category === event.target.value)?.name ?? "",
                        }
                      : prev
                  )
                }
                className="border rounded px-3 py-2"
              >
                {taxonomies.categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <select
                value={editingProduct.subcategory}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, subcategory: event.target.value }) : prev)}
                className="border rounded px-3 py-2"
              >
                {editSubcategories.map((item) => (
                  <option key={`${item.category}-${item.name}`} value={item.name}>{item.name}</option>
                ))}
              </select>

              <input
                value={editingProduct.image}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, image: event.target.value }) : prev)}
                placeholder="Image path"
                className="border rounded px-3 py-2 sm:col-span-2"
              />

              <div className="sm:col-span-2 border rounded p-3">
                <label className="block text-sm font-medium mb-2">Update Product Image</label>

                <div
                  onDragOver={(event) => {
                    if (isUploadBlocked) return;
                    event.preventDefault();
                    setEditIsDragOver(true);
                  }}
                  onDragLeave={() => setEditIsDragOver(false)}
                  onDrop={onEditDropImage}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isUploadBlocked ? "border-gray-200 bg-gray-50 opacity-60" : editIsDragOver ? "border-primary bg-emerald-50" : "border-emerald-200"
                  }`}
                >
                  <p className="text-sm text-gray-700 mb-2">
                    {isUploadBlocked ? "Upload is disabled until storage is ready." : "Drag & drop image here or select file"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onEditImageSelect}
                    disabled={isUploadBlocked}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {editUploadingImage && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Uploading image... {editUploadProgress}%</p>
                    <div className="w-full h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${editUploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {editUploadError && <p className="text-sm text-red-600 mt-2">{editUploadError}</p>}
                {editCompressionNote && <p className="text-sm text-emerald-700 mt-2">{editCompressionNote}</p>}

                {editingProduct.image && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Current image: {editingProduct.image}</p>
                    <NextImage src={editingProduct.image} alt="Product preview" width={112} height={112} className="h-28 w-28 object-cover rounded border" />
                  </div>
                )}
              </div>

              <input
                type="number"
                step="0.01"
                value={editingProduct.price}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, price: Number(event.target.value) }) : prev)}
                placeholder="Price"
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                value={editingProduct.stock}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, stock: Number(event.target.value) }) : prev)}
                placeholder="Stock"
                className="border rounded px-3 py-2"
              />

              <select
                value={editingProduct.discountType ?? ""}
                onChange={(event) =>
                  setEditingProduct((prev) =>
                    prev ? ({ ...prev, discountType: (event.target.value || undefined) as "percentage" | "fixed" | undefined }) : prev
                  )
                }
                className="border rounded px-3 py-2"
              >
                <option value="">No discount</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={editingProduct.discountValue ?? 0}
                onChange={(event) =>
                  setEditingProduct((prev) => prev ? ({ ...prev, discountValue: Number(event.target.value) }) : prev)
                }
                placeholder="Discount value"
                className="border rounded px-3 py-2"
              />

              <textarea
                value={editingProduct.description}
                onChange={(event) => setEditingProduct((prev) => prev ? ({ ...prev, description: event.target.value }) : prev)}
                placeholder="Description"
                className="border rounded px-3 py-2 sm:col-span-2"
              />

              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.flags.trending}
                  onChange={(event) =>
                    setEditingProduct((prev) =>
                      prev ? ({ ...prev, flags: { ...prev.flags, trending: event.target.checked } }) : prev
                    )
                  }
                />
                Trending
              </label>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.flags.ramadanExclusive}
                  onChange={(event) =>
                    setEditingProduct((prev) =>
                      prev ? ({ ...prev, flags: { ...prev.flags, ramadanExclusive: event.target.checked } }) : prev
                    )
                  }
                />
                Ramadan Exclusive
              </label>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.flags.bestSell}
                  onChange={(event) =>
                    setEditingProduct((prev) =>
                      prev ? ({ ...prev, flags: { ...prev.flags, bestSell: event.target.checked } }) : prev
                    )
                  }
                />
                Best Sell
              </label>
            </div>

            {editError && <p className="text-sm text-red-600 mt-3">{editError}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn bg-gray-100 text-gray-700" onClick={() => setEditingProduct(null)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={onSaveEditProduct} disabled={savingEdit || editUploadingImage}>
                {savingEdit ? "Saving..." : "Update Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      <datalist id="brand-options">
        {taxonomies.brands.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <div className="bg-white border border-emerald-100 rounded-xl p-4">
        <h2 className="text-lg font-bold mb-3">Search Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            placeholder="Search by product name"
            className="border rounded px-3 py-2"
          />

          <select value={searchCategory} onChange={(event) => setSearchCategory(event.target.value)} className="border rounded px-3 py-2">
            <option value="all">All Categories</option>
            {taxonomies.categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={searchBrand} onChange={(event) => setSearchBrand(event.target.value)} className="border rounded px-3 py-2">
            <option value="all">All Brands</option>
            {taxonomies.brands.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 gap-2 bg-emerald-50 p-3 text-sm font-semibold">
          <p>Image</p>
          <p>Name</p>
          <p>Category</p>
          <p>Brand</p>
          <p>Price</p>
          <p>Stock</p>
          <p>Actions</p>
        </div>
        {filteredProducts.map((product) => (
          <div key={product.id} className="grid grid-cols-7 gap-2 p-3 border-t text-sm items-center">
            <NextImage src={product.image} alt={product.name} width={40} height={40} className="h-10 w-10 rounded object-cover border" />
            <p>{product.name}</p>
            <p>{product.category}</p>
            <p>{product.brand}</p>
            <p>${product.price.toFixed(2)}</p>
            <p>{product.stock}</p>
            <div className="flex gap-2">
              <button className="btn bg-gray-100 text-gray-700" onClick={() => onEditProduct(product)}>Edit</button>
              <button className="btn bg-red-100 text-red-700" onClick={() => onDeleteProduct(product.id)}>Delete</button>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && <p className="p-4 text-sm text-gray-600">No matching products found.</p>}
      </div>
    </div>
  );
}
