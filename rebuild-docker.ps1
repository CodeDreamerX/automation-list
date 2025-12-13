# PowerShell script to rebuild and restart Docker container
# Usage: .\rebuild-docker.ps1

Write-Host "Stopping and removing existing container..." -ForegroundColor Yellow
docker stop automationlist-app 2>$null
docker rm automationlist-app 2>$null

Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t automationlist .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting container..." -ForegroundColor Green
    docker run -d -p 4321:4321 --name automationlist-app --env-file .env.local automationlist
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Container started successfully!" -ForegroundColor Green
        Write-Host "View logs with: docker logs -f automationlist-app" -ForegroundColor Cyan
        Write-Host "Access app at: http://localhost:4321" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to start container" -ForegroundColor Red
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}


