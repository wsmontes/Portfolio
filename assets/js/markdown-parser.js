/**
 * Markdown Parser
 * Converts markdown text into HTML with enhanced styling for code blocks and other elements
 */

const MarkdownParser = (function() {
  // Regular expressions for markdown patterns
  const patterns = {
    // Headers
    h1: /^# (.+)$/gm,
    h2: /^## (.+)$/gm,
    h3: /^### (.+)$/gm,
    h4: /^#### (.+)$/gm,
    h5: /^##### (.+)$/gm,
    h6: /^###### (.+)$/gm,
    
    // Horizontal rule
    hr: /^(---|\*\*\*|___)$/gm,
    
    // Bold and italic
    bold: /\*\*(.+?)\*\*/g,
    italic: /\*(.+?)\*(?!\*)|_(.+?)_/g,
    
    // Lists
    unorderedList: /^( *[\*\-\+] .+)$/gm,
    orderedList: /^( *\d+\. .+)$/gm,
    
    // Links and images
    link: /\[(.+?)\]\((.+?)\)/g,
    image: /!\[(.+?)\]\((.+?)\)/g,
    
    // Blockquotes
    blockquote: /^> (.+)$/gm,
    
    // Code blocks and inline code
    codeBlock: /```([\s\S]*?)```/g,
    inlineCode: /`([^`]+)`/g,
    
    // Tables
    table: /\|(.+)\|[\r\n]\|(?:[:|-]+[:|-]*)\|[\r\n]((?:\|.+\|[\r\n])+)/g,
    tableRow: /\|(.+)\|/g,
    
    // Checking for line breaks
    lineBreak: /\n\n/g
  };

  /**
   * Parse markdown text to HTML
   * @param {string} markdown - Markdown text to parse
   * @returns {string} - HTML content
   */
  const parse = function(markdown) {
    if (!markdown) {
      return '<p>No content available</p>';
    }

    // Sanitize the input to prevent XSS
    let html = escapeHtml(markdown);

    // Process code blocks first to avoid conflicts
    html = html.replace(patterns.codeBlock, function(match, p1) {
      // Check if the code block has a language declaration
      const codeContent = p1.trim();
      const firstLine = codeContent.split('\n')[0];
      
      let language = '';
      let code = codeContent;
      
      if (firstLine && !firstLine.includes(' ')) {
        // This might be a language declaration
        language = firstLine;
        code = codeContent.substring(firstLine.length).trim();
      }
      
      return `<pre><code class="language-${language}">${code}</code></pre>`;
    });

    // Process block elements
    html = html
      .replace(patterns.h1, '<h1>$1</h1>')
      .replace(patterns.h2, '<h2>$1</h2>')
      .replace(patterns.h3, '<h3>$1</h3>')
      .replace(patterns.h4, '<h4>$1</h4>')
      .replace(patterns.h5, '<h5>$1</h5>')
      .replace(patterns.h6, '<h6>$1</h6>')
      .replace(patterns.hr, '<hr>')
      .replace(patterns.blockquote, '<blockquote>$1</blockquote>');

    // Parse lists
    html = parseList(html);
    
    // Parse tables
    html = parseTable(html);
    
    // Convert paragraphs (lines separated by blank lines)
    html = wrapParagraphs(html);

    // Process inline elements
    html = html
      .replace(patterns.bold, '<strong>$1</strong>')
      .replace(patterns.italic, '<em>$1$2</em>')
      .replace(patterns.link, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(patterns.image, '<img src="$2" alt="$1" onerror="this.onerror=null;this.src=\'assets/images/placeholder.jpg\';this.classList.add(\'placeholder\');">')
      .replace(patterns.inlineCode, '<code>$1</code>');

    return html;
  };

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  const escapeHtml = function(text) {
    // Only escape < and > since we want to preserve other characters for markdown
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  /**
   * Parse and format lists
   * @param {string} html - HTML content
   * @returns {string} - HTML with formatted lists
   */
  const parseList = function(html) {
    // Process unordered lists
    let inList = false;
    let listContent = [];
    
    // First, handle unordered lists
    const lines = html.split('\n');
    let resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unorderedMatch = line.match(/^( *)[\*\-\+] (.+)$/);
      
      if (unorderedMatch) {
        const indent = unorderedMatch[1].length;
        const content = unorderedMatch[2];
        
        if (!inList) {
          resultLines.push('<ul>');
          inList = true;
        }
        
        resultLines.push(`<li>${content}</li>`);
        
        // Check if this is the last list item
        const nextLine = lines[i+1];
        if (!nextLine || !nextLine.match(/^( *)[\*\-\+] (.+)$/)) {
          resultLines.push('</ul>');
          inList = false;
        }
      }
      else if (inList) {
        // If we're in a list but this line isn't a list item, end the list
        resultLines.push('</ul>');
        inList = false;
        resultLines.push(line);
      }
      else {
        resultLines.push(line);
      }
    }
    
    // Process ordered lists with similar approach
    html = resultLines.join('\n');
    
    inList = false;
    resultLines = [];
    
    const orderedLines = html.split('\n');
    for (let i = 0; i < orderedLines.length; i++) {
      const line = orderedLines[i];
      const orderedMatch = line.match(/^( *)\d+\. (.+)$/);
      
      if (orderedMatch) {
        const indent = orderedMatch[1].length;
        const content = orderedMatch[2];
        
        if (!inList) {
          resultLines.push('<ol>');
          inList = true;
        }
        
        resultLines.push(`<li>${content}</li>`);
        
        // Check if this is the last list item
        const nextLine = orderedLines[i+1];
        if (!nextLine || !nextLine.match(/^( *)\d+\. (.+)$/)) {
          resultLines.push('</ol>');
          inList = false;
        }
      }
      else if (inList) {
        // If we're in a list but this line isn't a list item, end the list
        resultLines.push('</ol>');
        inList = false;
        resultLines.push(line);
      }
      else {
        resultLines.push(line);
      }
    }
    
    return resultLines.join('\n');
  };
  
  /**
   * Parse and format tables
   * @param {string} html - HTML content 
   * @returns {string} - HTML with formatted tables
   */
  const parseTable = function(html) {
    return html.replace(/\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.+\|\n)+)/g, function(match, header, separator, rows) {
      const headers = header.split('|').map(h => h.trim()).filter(h => h);
      const separators = separator.split('|').map(s => s.trim()).filter(s => s);
      const align = separators.map(s => {
        if (s.startsWith(':') && s.endsWith(':')) return 'center';
        if (s.endsWith(':')) return 'right';
        return 'left';
      });
      
      const rowsArray = rows.trim().split('\n');
      
      let tableHtml = '<div class="table-scroll-wrapper"><table><thead><tr>';
      
      // Add headers
      headers.forEach((h, i) => {
        const alignment = align[i] || 'left';
        tableHtml += `<th style="text-align: ${alignment}">${h}</th>`;
      });
      
      tableHtml += '</tr></thead><tbody>';
      
      // Add rows
      rowsArray.forEach(row => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        tableHtml += '<tr>';
        
        cells.forEach((c, i) => {
          const alignment = align[i] || 'left';
          tableHtml += `<td style="text-align: ${alignment}">${c}</td>`;
        });
        
        tableHtml += '</tr>';
      });
      
      tableHtml += '</tbody></table></div>';
      return tableHtml;
    });
  };

  /**
   * Wrap text blocks as paragraphs
   * @param {string} html - HTML content
   * @returns {string} - HTML with paragraphs
   */
  const wrapParagraphs = function(html) {
    // Split on double newlines (blank lines)
    const blocks = html.split(/\n{2,}/);
    
    // Process each block
    return blocks.map(block => {
      const trimmedBlock = block.trim();
      
      // Skip wrapping if block is already a block element
      if (!trimmedBlock || 
          trimmedBlock.startsWith('<h') ||
          trimmedBlock.startsWith('<ul') ||
          trimmedBlock.startsWith('<ol') ||
          trimmedBlock.startsWith('<blockquote') ||
          trimmedBlock.startsWith('<pre') ||
          trimmedBlock.startsWith('<hr') ||
          trimmedBlock.startsWith('<table')) {
        return trimmedBlock;
      }
      
      // Wrap in paragraph tags
      return `<p>${trimmedBlock}</p>`;
    }).join('\n\n');
  };

  return {
    parse: parse
  };
})();

// Make the parser globally available
window.MarkdownParser = MarkdownParser;
