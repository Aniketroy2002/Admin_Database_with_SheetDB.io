// Configuration of sheetdb.io api where you store your data
const SHEETDB_API_URL = 'Your_SheetDB.io_Url';

const tableBody = document.getElementById('data-table-body');
const refreshBtn = document.getElementById('refresh-btn');
const totalCount = document.getElementById('total-count');

// Fetch data from SheetDB.io
async function fetchData() {
    try {
        refreshBtn.innerHTML = '<div class="spinner"></div> Loading';
        refreshBtn.disabled = true;

        const response = await fetch(SHEETDB_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data. Please check console for details.');
        return [];
    } finally {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
    }
}

// Delete entry from SheetDB.io
async function deleteEntry(index, identifier) {
    if (!identifier || identifier === 'N/A') {
        console.error('Cannot delete: No valid identifier found for this row');
        alert('This entry cannot be deleted because it has no valid identifier');
        return false;
    }

    try {
        // Correct DELETE endpoint format for SheetDB.io
        const response = await fetch(`${SHEETDB_API_URL}/Email/${encodeURIComponent(identifier)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`Failed to delete: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Delete successful:', result);
        
        // Verify deletion was successful
        if (result.deleted === undefined || result.deleted < 1) {
            throw new Error('No rows were deleted');
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert(`Error deleting entry: ${error.message}`);
        return false;
    }
}

// Display data in the table
function displayData(rows) {
    // Update total count
    totalCount.textContent = rows.length;
    
    // Clear existing table data
    tableBody.innerHTML = '';
    
    // Add new rows with serial numbers
    rows.forEach((row, index) => {
        const { Email: email, Message: message, id } = row;
        // Use email as primary identifier, fallback to id if available
        const identifier = email || id || 'N/A';
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${email || 'N/A'}</td>
            <td>${message || 'N/A'}</td>
            <td>
                <button class="action-btn delete-btn" data-id="${index}" data-identifier="${identifier}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            const index = button.getAttribute('data-id');
            const identifier = button.getAttribute('data-identifier');
            
            if (confirm('Are you sure you want to delete this specific entry?')) {
                button.innerHTML = '<div class="spinner"></div>';
                button.disabled = true;
                
                const success = await deleteEntry(index, identifier);
                
                button.innerHTML = '<i class="fas fa-trash"></i>';
                button.disabled = false;
                
                if (success) {
                    await refreshData();
                }
            }
        });
    });
}

// Refresh data
async function refreshData() {
    const data = await fetchData();
    displayData(data);
}

// Initialize the dashboard
async function initDashboard() {
    // Load data on page load
    await refreshData();
    
    // Set up refresh button
    refreshBtn.addEventListener('click', refreshData);
    
    // Set up auto-refresh every 30 seconds
    setInterval(refreshData, 30000);
}

// Start the dashboard
document.addEventListener('DOMContentLoaded', initDashboard);