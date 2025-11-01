/**
 * Utility functions for copying text to clipboard with fallbacks
 */

export interface CopyResult {
  success: boolean;
  method: 'clipboard' | 'execCommand' | 'selection' | 'failed';
  error?: string;
}

/**
 * Attempts to copy text to clipboard using multiple fallback methods
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  // Method 1: Modern Clipboard API
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    }
  } catch (error) {
    // Silent error
  }

  // Method 2: Legacy execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea off-screen but still focusable
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    document.body.appendChild(textArea);
    
    // Focus and select
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    
    // Attempt copy
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return { success: true, method: 'execCommand' };
    } else {
      throw new Error('execCommand returned false');
    }
  } catch (error) {
    // Silent error
  }

  // Method 3: Create a temporary element and select its content
  try {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-999999px';
    tempDiv.style.top = '-999999px';
    tempDiv.style.opacity = '0';
    tempDiv.style.pointerEvents = 'none';
    tempDiv.textContent = text;
    
    document.body.appendChild(tempDiv);
    
    const selection = window.getSelection();
    const range = document.createRange();
    
    if (selection) {
      range.selectNodeContents(tempDiv);
      selection.removeAllRanges();
      selection.addRange(range);
      
      const copySuccessful = document.execCommand('copy');
      document.body.removeChild(tempDiv);
      
      if (copySuccessful) {
        return { success: true, method: 'selection' };
      }
    }
    
    document.body.removeChild(tempDiv);
  } catch (error) {
    // Silent error
  }

  return { 
    success: false, 
    method: 'failed', 
    error: 'All copy methods failed. Please manually select and copy the text.' 
  };
}

/**
 * Selects text content of an element for manual copying
 */
export function selectElementText(element: HTMLElement): boolean {
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    
    if (selection) {
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }
  } catch (error) {
    // Silent error
  }
  
  return false;
}