// Custom Navbar Component
class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <header class="bg-gray-800 shadow-lg">
            <nav class="container mx-auto px-4 py-3">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i data-feather="camera" class="w-8 h-8 text-indigo-500 mr-3"></i>
                            <a href="index.html" class="text-2xl font-bold">Face<span class="text-indigo-500">Whiz</span></a>
                        </div>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <div class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                            <a href="index.html" class="text-indigo-400 font-medium flex items-center">
                                <i data-feather="home" class="w-4 h-4 mr-2"></i> Dashboard
                            </a>
                            <a href="people.html" class="text-gray-300 hover:text-white font-medium flex items-center">
                                <i data-feather="users" class="w-4 h-4 mr-2"></i> People
                            </a>
                            <a href="settings.html" class="text-gray-300 hover:text-white font-medium flex items-center">
                                <i data-feather="settings" class="w-4 h-4 mr-2"></i> Settings
                            </a>
                            <a href="help.html" class="text-gray-300 hover:text-white font-medium flex items-center">
                                <i data-feather="help-circle" class="w-4 h-4 mr-2"></i> Help
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
        `;
        
        // Initialize Feather icons if available
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
}

customElements.define('custom-navbar', CustomNavbar);