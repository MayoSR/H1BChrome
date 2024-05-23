let jobTitles = null
let timeoutTracker = null
let scrollWindow = null
let companyData = null
let jobSet = new Set()
let h1bSponsorships = {
    
}

let currentCompanyHovered = null

function removeCorporationSuffix(inputString) {
    let cleanedString = inputString.split(",")[0];
    cleanedString = cleanedString.replace(/&/g, "AND");
    const regex = /(?:\b|[^A-Za-z0-9_])(.+?)(?:\b|[^A-Za-z0-9_])\s*(?:LLC|INC|CORP|CO|LTD|LIMITED|TECH|TECHNOLOGIES|PTY|AG|GMBH|SRL|SA|AS|PLC|PC|LP|LLP|BV|NV|KG|OY|OYJ)?[\s.]*$/i
    ;
    const matches = cleanedString.match(regex);
  
    if (matches && matches.length > 1) {
      return matches[1].trim();
    }
    return cleanedString.trim();
};

function getJobTitles(jobTitles) {
    jobSet = new Set()
    for (let i = 0; i < jobTitles.length; i++) {
        if (jobSet.has(jobTitles[i].innerText)) {
            continue;
        }
        jobSet.add(jobTitles[i].innerText)
        let parsedCompany = removeCorporationSuffix(jobTitles[i].innerText.split('·')[0])
        h1bSponsorships[jobTitles[i].innerText] = companyH1BSponsorships(removeCorporationSuffix(parsedCompany))
    }
    // console.log(h1bSponsorships, jobNameParsed)
}

function companyH1BSponsorships(companyName) {
    let matched_companies = [];

    Object.keys(companyData).forEach((key) => {
        if (companyName.toUpperCase().startsWith(key.toUpperCase()) || key.toUpperCase().startsWith(companyName.toUpperCase())) {
            matched_companies.push({
                name: key,
                sponsorships: companyData[key]
            });
        }
    });
    return matched_companies;
}

setTimeout(() => {
    const scrollSpyInterval = setInterval(() => {
        if (!scrollWindow) {
            scrollWindow = document.getElementsByClassName("jobs-search-results-list")[0];
            taskList()
        }
        else {
            clearInterval(scrollSpyInterval);
            taskList()
            scrollWindow.addEventListener('scroll', () => {
                if (timeoutTracker) {
                    clearTimeout(timeoutTracker);
                }
                timeoutTracker = setTimeout(() => {
                    taskList()
                }, 500);
            });
        }
        taskList()
    }, 500);
}, 2000);


function taskList(){
    jobTitles = document.getElementsByClassName('job-card-container__primary-description');
    getJobTitles(jobTitles);
    attachCompanySponsorChipandTableView();
}

function createSponsorshipTable(data) {
    let table = document.getElementById('sponsorship-table');
    if (!table) {
        // If the table doesn't exist, create and append it
        table = document.createElement('table');
        table.id = 'sponsorship-table';
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.fontSize = '12px';
        document.getElementById('sponsorship-table-container').appendChild(table);
    } else {
        // Clear the existing table contents
        table.innerHTML = '';
    }
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.fontSize = '12px'; // Adjust font size as needed

    // Create the header row
    const headerRow = table.createTHead().insertRow();
    const headers = ['Company', 'Year', 'Initial Approval', 'Initial Denial', 'Continuing Approval', 'Continuing Denial'];
    headers.forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerCell.style.border = '1px solid black';
        headerCell.style.padding = '5px';
        headerCell.style.backgroundColor = '#ddd'; // Light grey background for header
        headerRow.appendChild(headerCell);
    });

    // Create a body for the table
    const tbody = table.createTBody();

    // Populate the table with data
    data.forEach(item => {
        Object.entries(item.sponsorships).forEach(([year, values]) => {
            const row = tbody.insertRow();
            // Company name only on the first entry
            if (Object.keys(item.sponsorships)[0] === year) {
                const nameCell = row.insertCell();
                nameCell.textContent = item.name;
                nameCell.rowSpan = Object.keys(item.sponsorships).length; // Merge cells for the same company
                nameCell.style.border = '1px solid black';
                nameCell.style.padding = '5px';
            }

            // Year and sponsorship values
            const yearCell = row.insertCell();
            yearCell.textContent = year;
            yearCell.style.border = '1px solid black';
            yearCell.style.padding = '5px';

            values.forEach(value => {
                const valueCell = row.insertCell();
                valueCell.textContent = value;
                valueCell.style.border = '1px solid black';
                valueCell.style.padding = '5px';
            });
        });
    });

    // Append the table to the document body or a specific container
    return table
}


async function fetchDataFromFile() {
    try {
        const response = await fetch(chrome.runtime.getURL('companies.json'));
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        companyData = await response.json();
    } catch (error) {
        console.error("Could not fetch companies.json:", error);
    }
}

fetchDataFromFile()

function chip(isSponsored) {
    let chipElement = document.createElement('div');
    chipElement.className = 'company-sponsor-chip';
    chipElement.style = 'display: inline; font-size: 10px; padding: 2px 4px; border-radius: 5px; color: white; background-color: ' + (isSponsored ? 'green' : 'red');
    chipElement.innerText = "H1B";
    return chipElement;
}
function displayTableTab(jobData) {
    // Create the table tab div and set its properties
    const tableTab = document.createElement('div');
    tableTab.className = 'company-sponsor-history-tab';
    tableTab.style = 'display: inline; font-size: 10px; padding: 2px 4px; border-radius: 5px; color: white; background-color: #007bff; width: 40px';
    tableTab.innerText = "History";

    tableTab.onmouseover = () => {
        // Find the container and clear its previous content
        const container = document.getElementById('sponsorship-table-container');
        container.innerHTML = ''; // Clear previous table if any

        // Create and populate a new table with jobData
        sponsorContainer = document.getElementById("sponsorship-table-container")
        sponsorContainer.style.display = 'block';
        sponsorContainer.appendChild(createSponsorshipTable(jobData));

        // Position the container next to the tableTab (History button)
        const rect = tableTab.getBoundingClientRect();
        container.style.display = 'block'; // Make container visible
        container.style.left = `${rect.right}px`; // Position to the right of the button
        container.style.top = `${rect.top}px`; // Align to the top of the button
    };

    tableTab.onmouseleave = () => {
        const container = document.getElementById('sponsorship-table-container');
        container.style.display = 'none'; // Hide the container
    };

    return tableTab;
}

function ensureTableContainerExists() {
    let container = document.getElementById('sponsorship-table-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sponsorship-table-container';
        document.body.appendChild(container); // Append to the body or another appropriate container element
    }
    
    // Style the container
    container.style.display = 'none'; // Initially hidden
    container.style.position = 'absolute'; // Or 'fixed', depending on your layout needs
    container.style.width = 'auto'; // Or specify a width
    container.style.height = 'auto'; // Or specify a height
    container.style.backgroundColor = '#fff'; // Background color
    container.style.border = '1px solid #ddd'; // Border (optional)
    container.style.zIndex = '1000'; // Ensure it's above other content
    container.style.overflow = 'auto'; // In case of overflow
    container.style.padding = '10px'; // Padding (optional for aesthetics)
}

// Call this function early in your script or when the page loads
ensureTableContainerExists();


function attachCompanySponsorChipandTableView(){
    try{
        dismissButtons = document.querySelectorAll('.job-card-container__primary-description');
        for (let i = 0; i < dismissButtons.length; i++) {
            const jobData = h1bSponsorships[dismissButtons[i].innerText];
            console.log("DismissBtn",dismissButtons[i].innerText,"h1b",h1bSponsorships,"jobdata",jobData)
            if (jobData.length > 0 && !jobTitles[i].parentNode.querySelector('.company-sponsor-chip')) {
                jobTitles[i].parentNode.appendChild(chip(true));
                dismissButtons[i].parentNode.appendChild(displayTableTab(jobData));
            } else if (!jobTitles[i].parentNode.querySelector('.company-sponsor-chip')) {
                jobTitles[i].appendChild(chip(false));
            }
        }
    }
    catch(e){
    }
}

let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    onUrlChange();
  }
}).observe(document, {subtree: true, childList: true});

function onUrlChange() {
    // console.log("Url chaned");
    jobNameParsed = []
    jobSet = new Set()
    h1bSponsorships = {}
    taskList()
    attachCompanySponsorChipandTableView()
}