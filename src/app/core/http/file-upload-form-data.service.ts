import { Injectable } from '@angular/core';

type UploadFieldValue = string | number | boolean | null | undefined;

/** Shared helper for multipart saves that include one optional binary file. */
@Injectable({ providedIn: 'root' })
export class FileUploadFormDataService {
  toFormData(fields: Record<string, UploadFieldValue>, file?: File, fileField = 'file'): FormData {
    const form = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      form.set(key, value === null || value === undefined ? '' : String(value));
    }

    if (file !== undefined) {
      form.set(fileField, file, file.name);
    }

    return form;
  }
}