// Vendor Form Client-Side Logic
import { initTitleLengthFeedback } from './title-length-feedback';

// Helper function to map form variant to LogoBox CSS classes
function getVariantClasses(formVariant: string): string {
  const variantMap: Record<string, string> = {
    white: 'bg-white border border-gray-200',
    light: 'bg-gray-100 border border-gray-200', // Light Gray
    gray: 'bg-gray-100 border border-gray-200',
    dark: 'bg-gray-900 border border-gray-700',
    brand: 'bg-brand-50 border border-gray-200',
  };
  return variantMap[formVariant] || variantMap.white;
}

function isSvgLogo(logoUrl: string, logoFormat?: string): boolean {
  if (logoFormat?.toLowerCase() === 'svg') return true;
  if (!logoUrl) return false;
  try {
    const pathname = new URL(logoUrl, window.location.origin).pathname;
    return pathname.toLowerCase().endsWith('.svg');
  } catch {
    return /\.svg(\?|#|$)/i.test(logoUrl);
  }
}

// Helper function to update preview with variant (optional override URL for local blob preview)
function updatePreviewWithVariant(variant: string, overrideUrl?: string) {
  const logoPreviewContainer = document.getElementById('logo-preview-container');
  if (!logoPreviewContainer) return;
  
  const logoUrlHidden = document.getElementById('logo_url') as HTMLInputElement;
  const logoAltHidden = document.getElementById('logo_alt') as HTMLInputElement;
  const logoFormatHidden = document.getElementById('logo_format') as HTMLInputElement;
  const nameInput = document.getElementById('name') as HTMLInputElement;
  
  const logoUrl = overrideUrl?.trim() || logoUrlHidden?.value?.trim() || '';
  const logoAlt = logoAltHidden?.value?.trim() || '';
  const vendorName = nameInput?.value?.trim() || 'Vendor';
  const displayAlt = logoAlt || `${vendorName} logo`;
  const bgClasses = getVariantClasses(variant);
  
  if (logoUrl) {
    const logoBoxDiv = document.createElement('div');
    logoBoxDiv.className = `w-[200px] h-[80px] flex items-center justify-center rounded-lg ${bgClasses} p-2`;
    logoBoxDiv.setAttribute('style', 'overflow: hidden;');
    
    const imgEl = document.createElement('img');
    imgEl.src = logoUrl;
    imgEl.alt = displayAlt;
    imgEl.setAttribute('style', 'pointer-events: none; display: block; width: auto; height: auto; max-width: 184px; max-height: 64px; object-fit: contain;');
    imgEl.loading = 'lazy';
    imgEl.decoding = 'async';
    if (isSvgLogo(logoUrl, logoFormatHidden?.value)) {
      imgEl.setAttribute('referrerpolicy', 'no-referrer');
    }
    logoBoxDiv.appendChild(imgEl);
    
    logoPreviewContainer.innerHTML = '';
    logoPreviewContainer.appendChild(logoBoxDiv);
    logoPreviewContainer.setAttribute('data-variant', variant);
  } else {
    const logoBoxDiv = document.createElement('div');
    logoBoxDiv.className = 'w-[200px] h-[80px] flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200';
    const spanEl = document.createElement('span');
    spanEl.className = 'text-xs text-gray-400';
    spanEl.textContent = 'No Logo';
    logoBoxDiv.appendChild(spanEl);
    
    logoPreviewContainer.innerHTML = '';
    logoPreviewContainer.appendChild(logoBoxDiv);
    logoPreviewContainer.setAttribute('data-variant', variant);
  }
}

// Initialize form handlers
export function initVendorForm() {
  initTitleLengthFeedback(['name', 'country']);
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const slugInput = document.getElementById('slug') as HTMLInputElement;
  const websiteInput = document.getElementById('website') as HTMLInputElement;

  if (!nameInput || !slugInput || !websiteInput) return;
  
  // Track if slug was manually edited
  let slugManuallyEdited = false;
  const initialSlug = slugInput.value;
  const isNewVendor = !initialSlug || initialSlug.trim() === '';
  
  // Auto-generate slug from name (only for new vendors, until manually edited)
  nameInput.addEventListener('input', function() {
    // Only auto-generate for new vendors if user hasn't manually edited the slug
    if (isNewVendor && !slugManuallyEdited) {
      const name = nameInput.value.trim();
      if (name) {
        // Convert to slug: lowercase, replace spaces and special chars with hyphens
        const slug = name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-')      // Replace spaces with hyphens
          .replace(/-+/g, '-')       // Replace multiple hyphens with single
          .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
        slugInput.value = slug;
      } else {
        // Clear slug if name is empty
        slugInput.value = '';
      }
    }
  });
  
  // Track manual slug edits
  slugInput.addEventListener('input', function() {
    // Mark as manually edited if user changes the slug
    slugManuallyEdited = true;
  });
  
  // Auto-prefix website URL with https://
  websiteInput.addEventListener('blur', function() {
    let url = websiteInput.value.trim();
    if (url && !url.match(/^https?:\/\//i)) {
      // Only add https:// if it doesn't already have a protocol
      websiteInput.value = 'https://' + url;
    }
  });
  
  // Also handle on form submit to ensure it's always prefixed
  const form = document.getElementById('vendor-form');
  if (form) {
    form.addEventListener('submit', function() {
      let url = websiteInput.value.trim();
      if (url && !url.match(/^https?:\/\//i)) {
        websiteInput.value = 'https://' + url;
      }

      // Sync manual logo URL override if provided
      const logoUrlManual = document.getElementById('logo_url_manual') as HTMLInputElement;
      const logoUrlHidden = document.getElementById('logo_url') as HTMLInputElement;
      if (logoUrlManual && logoUrlHidden) {
        const manualUrl = logoUrlManual.value.trim();
        if (manualUrl) {
          logoUrlHidden.value = manualUrl;
        }
      }
    });
  }
  
  // Variant selector change handler
  const backgroundVariantSelect = document.getElementById('logo-background-variant') as HTMLSelectElement;
  const logoPreviewContainer = document.getElementById('logo-preview-container');
  if (backgroundVariantSelect && logoPreviewContainer) {
    backgroundVariantSelect.addEventListener('change', function() {
      const selectedVariant = backgroundVariantSelect.value.trim() || 'white';
      updatePreviewWithVariant(selectedVariant);
    });
  }
  
  // Manual logo URL override handler
  const logoUrlManual = document.getElementById('logo_url_manual') as HTMLInputElement;
  const logoUrlHidden = document.getElementById('logo_url') as HTMLInputElement;
  if (logoUrlManual) {
    logoUrlManual.addEventListener('input', function() {
      const manualUrl = logoUrlManual.value.trim();
      if (manualUrl && logoUrlHidden) {
        logoUrlHidden.value = manualUrl;
        const selectedVariant = backgroundVariantSelect?.value?.trim() || 'white';
        updatePreviewWithVariant(selectedVariant);
      } else if (!manualUrl && logoUrlHidden) {
        // Clear preview if manual URL is cleared
        const selectedVariant = backgroundVariantSelect?.value?.trim() || 'white';
        updatePreviewWithVariant(selectedVariant);
      }
    });
  }
  
  // Logo Upload Handler
  const logoFileInput = document.getElementById('logo-file-input') as HTMLInputElement;
  const logoUploadLoading = document.getElementById('logo-upload-loading');
  const logoUploadSuccess = document.getElementById('logo-upload-success');
  const logoUploadError = document.getElementById('logo-upload-error');
  const logoUploadErrorText = document.getElementById('logo-upload-error-text');
  const logoWidthHidden = document.getElementById('logo_width') as HTMLInputElement;
  const logoHeightHidden = document.getElementById('logo_height') as HTMLInputElement;
  const logoFormatHidden = document.getElementById('logo_format') as HTMLInputElement;
  const logoAltHidden = document.getElementById('logo_alt') as HTMLInputElement;
  
  if (logoFileInput) {
    logoFileInput.addEventListener('change', async function(e) {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Get vendor slug and name from form
      const slugInput = document.getElementById('slug') as HTMLInputElement;
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const vendorIdInput = document.querySelector('input[name="id"]') as HTMLInputElement;
      
      const vendorSlug = slugInput?.value?.trim();
      const vendorName = nameInput?.value?.trim();
      const backgroundVariant = backgroundVariantSelect?.value?.trim() || 'white';
      const vendorId = vendorIdInput?.value?.trim();
      
      if (!vendorSlug) {
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = 'Please enter a vendor slug first';
          logoUploadError.classList.remove('hidden');
          logoUploadSuccess?.classList.add('hidden');
        }
        return;
      }
      
      if (!vendorName) {
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = 'Please enter a vendor name first';
          logoUploadError.classList.remove('hidden');
          logoUploadSuccess?.classList.add('hidden');
        }
        return;
      }
      
      // Validate file type (extension + MIME — Windows often leaves file.type empty for SVG)
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/svg'];
      const fileName = file.name.toLowerCase().trim();
      const fileMime = file.type.toLowerCase().trim();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      const hasValidMime = fileMime.length > 0 && allowedMimeTypes.includes(fileMime);
      
      if (!hasValidExtension && !hasValidMime) {
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = 'Invalid file type. Only PNG, JPG, JPEG, WEBP, and SVG are allowed.';
          logoUploadError.classList.remove('hidden');
          logoUploadSuccess?.classList.add('hidden');
        }
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = 'File size exceeds 2MB limit';
          logoUploadError.classList.remove('hidden');
          logoUploadSuccess?.classList.add('hidden');
        }
        return;
      }
      
      // Show loading state
      logoUploadLoading?.classList.remove('hidden');
      logoUploadSuccess?.classList.add('hidden');
      logoUploadError?.classList.add('hidden');

      // Immediate local preview (avoids remote <object> loads that trigger browser Save dialogs)
      const localPreviewUrl = URL.createObjectURL(file);
      updatePreviewWithVariant(backgroundVariant, localPreviewUrl);
      
      // Prepare FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorSlug', vendorSlug);
      formData.append('vendorName', vendorName);
      formData.append('backgroundVariant', backgroundVariant);
      if (vendorId) {
        formData.append('vendorId', vendorId);
      }
      
      try {
        // Upload to API
        const response = await fetch('/api/admin/upload-logo', {
          method: 'POST',
          credentials: 'same-origin',
          body: formData
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(`Upload failed (${response.status}). Server returned an unexpected response.`);
        }

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }
        
        // Update hidden fields - data is now wrapped in result.data after response standardization
        const uploadData = result.data || result; // Support both formats for backward compatibility
        if (logoUrlHidden) logoUrlHidden.value = uploadData.publicUrl || '';
        if (logoWidthHidden) logoWidthHidden.value = uploadData.width?.toString() || '';
        if (logoHeightHidden) logoHeightHidden.value = uploadData.height?.toString() || '';
        if (logoFormatHidden) logoFormatHidden.value = uploadData.format || '';
        if (logoAltHidden) logoAltHidden.value = uploadData.altText || '';
        
        // Update preview with selected variant (remote URL)
        updatePreviewWithVariant(backgroundVariant);

        // Allow re-selecting the same file
        logoFileInput.value = '';
        
        // Show success message
        logoUploadLoading?.classList.add('hidden');
        logoUploadSuccess?.classList.remove('hidden');
        logoUploadError?.classList.add('hidden');
        
        // Show delete button if vendor has ID (for new vendors, it won't show until vendor is saved)
        const deleteLogoContainer = document.getElementById('delete-logo-container');
        if (deleteLogoContainer && vendorId) {
          deleteLogoContainer.classList.remove('hidden');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          logoUploadSuccess?.classList.add('hidden');
        }, 3000);
        
      } catch (error: any) {
        console.error('Logo upload error:', error);
        logoUploadLoading?.classList.add('hidden');
        logoUploadSuccess?.classList.add('hidden');
        updatePreviewWithVariant(backgroundVariantSelect?.value?.trim() || 'white');
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = error.message || 'Failed to upload logo. Please try again.';
          logoUploadError.classList.remove('hidden');
        }
      } finally {
        URL.revokeObjectURL(localPreviewUrl);
      }
    });
  }
  
  // Delete Logo Handler
  const deleteLogoButton = document.querySelector('#delete-logo-button') as HTMLButtonElement | null;
  if (deleteLogoButton) {
    deleteLogoButton.addEventListener('click', async function() {
      const vendorIdInput = document.querySelector('input[name="id"]') as HTMLInputElement;
      const vendorId = vendorIdInput?.value?.trim();
      
      if (!vendorId) {
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = 'Vendor ID is required to delete logo';
          logoUploadError.classList.remove('hidden');
          logoUploadSuccess?.classList.add('hidden');
        }
        return;
      }
      
      // Confirm deletion
      if (!confirm('Are you sure you want to delete this logo? This action cannot be undone.')) {
        return;
      }
      
      // Show loading state
      deleteLogoButton.disabled = true;
      deleteLogoButton.textContent = 'Deleting...';
      logoUploadLoading?.classList.remove('hidden');
      logoUploadSuccess?.classList.add('hidden');
      logoUploadError?.classList.add('hidden');
      
      try {
        // Call delete API
        const response = await fetch('/api/admin/delete-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: vendorId }),
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to delete logo');
        }
        
        // Clear hidden fields
        if (logoUrlHidden) logoUrlHidden.value = '';
        if (logoWidthHidden) logoWidthHidden.value = '';
        if (logoHeightHidden) logoHeightHidden.value = '';
        if (logoFormatHidden) logoFormatHidden.value = '';
        if (logoAltHidden) logoAltHidden.value = '';
        
        // Clear preview with current variant
        const currentVariant = backgroundVariantSelect?.value?.trim() || 'white';
        updatePreviewWithVariant(currentVariant);
        
        // Hide delete button container
        const deleteLogoContainer = document.getElementById('delete-logo-container');
        if (deleteLogoContainer) {
          deleteLogoContainer.classList.add('hidden');
        }
        
        // Show success message
        logoUploadLoading?.classList.add('hidden');
        if (logoUploadSuccess && logoUploadErrorText) {
          logoUploadErrorText.textContent = 'Logo deleted successfully!';
          logoUploadErrorText.classList.remove('text-red-600');
          logoUploadErrorText.classList.add('text-green-600');
          logoUploadError?.classList.remove('hidden');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          logoUploadError?.classList.add('hidden');
          if (logoUploadErrorText) {
            logoUploadErrorText.classList.remove('text-green-600');
            logoUploadErrorText.classList.add('text-red-600');
          }
        }, 3000);
        
      } catch (error: any) {
        console.error('Logo delete error:', error);
        logoUploadLoading?.classList.add('hidden');
        logoUploadSuccess?.classList.add('hidden');
        if (logoUploadError && logoUploadErrorText) {
          logoUploadErrorText.textContent = error.message || 'Failed to delete logo. Please try again.';
          logoUploadError.classList.remove('hidden');
        }
      } finally {
        // Re-enable button
        deleteLogoButton.disabled = false;
        deleteLogoButton.textContent = 'Delete Logo';
      }
    });
  }
}

