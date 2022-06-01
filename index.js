const canvas = document.getElementById("game-container");
const boundary = canvas.getBoundingClientRect();
const counter = document.getElementById("points");
const gameOver = document.getElementById("game-over");
gameOver.classList.add("hidden");
canvas.classList.add("show");
const ctx = canvas.getContext('2d');
canvas.height = innerHeight;
canvas.width = innerWidth;


//* PARTIE MOULES */
class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Player extends Entity {
    constructor(x, y, radius, color) {
        super(x, y, radius);
        this.color = color;
    }
}

class Projectile extends Player {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color);
        this.velocity = velocity;
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy extends Projectile {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color, velocity);
    }
}

class Particle extends Enemy {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color, velocity);
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

//  Création de notre player central
const test = new Entity(canvas.width / 3, canvas.height / 2, 20);
const player = new Player(canvas.width / 2, canvas.height / 2, 20, "pink");

// Création des tableaux / variables qui vont stocker nos données crées pendant la partie
const projectiles = [];
const enemies = [];
const particles = [];
let points = 0;
counter.textContent = points;

//  Animation de la partie
let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.draw();

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    // Dès qu'un' projectile sort de l'écran, il est retiré du tableau [projectiles]
    projectiles.forEach((projectile, index) => {
        if (projectile.x - projectile.radius < 0 ||
            projectile.x + projectile.radius > canvas.width ||
            projectile.y - projectile.radius < 0 ||
            projectile.y + projectile.radius > canvas.height) {
            projectiles.splice(index, 1);
        }
        projectile.update();
    });

    // Dès qu'un ennemi est touché, sa taille est réduite (si radius > 15), sinon il est détruit et on gagne 20pts :) 
    enemies.forEach((enemy, enemyIndex) => {
        projectiles.forEach((projectile, projectileIndex) => {
            const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (distance - projectile.radius - enemy.radius <= 0) {

                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * (3 - 1) + 1, enemy.color, {
                        x: (Math.random() - 0.5) * 3,
                        y: (Math.random() - 0.5) * 3,
                    }));
                }

                if (enemy.radius - 10 > 5) {
                    gsap.to(enemy, {
                        radius: enemy.radius - 10,
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                        points += 10;
                    }, 0);
                } else {
                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                        points += 20;
                        counter.textContent = points;
                    }, 0);
                }
            }
        });

        const distPlayerEnemy = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distPlayerEnemy - enemy.radius - player.radius <= 0) {
            cancelAnimationFrame(animationId);
            gameOver.classList.remove("hidden");
            gameOver.classList.add("show");
            canvas.classList.add("hidden");
            canvas.classList.remove("show")
        }

        enemy.update();
    });
}
animate();

// Fonction qui fait apparaître les ennemis toutes les 1.5sec
function spawnEnemies() {

    setInterval(() => {
        const radius = Math.random() * (30 - 4) + 9;

        const r = Math.floor(Math.random() * 206);
        const g = Math.floor(Math.random() * 206);
        const b = Math.floor(Math.random() * 206);
        const color = `rgba(${r}, ${g}, ${b}, 0.8)`;

        const randomValue = Math.random();
        let x, y;
        if (randomValue < 0.25) {
            x = 0 - radius;
            y = Math.random() * canvas.height;
        } else if (randomValue >= 0.25 && randomValue < 0.5) {
            x = canvas.width + radius;
            y = Math.random() * canvas.height;
        } else if (randomValue >= 0.5 && randomValue < 0.75) {
            x = Math.random() * canvas.width;
            y = 0 - radius;
        } else if (randomValue >= 0.75) {
            x = Math.random() * canvas.width;
            y = canvas.height + radius;
        }

        const angle = Math.atan2(player.y - y, player.x - x);
        const velocity = {
            x: Math.cos(angle) * 2,
            y: Math.sin(angle) * 2,
        };

        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1500);
}
spawnEnemies();



// Event pour faire apparaître les projectiles
window.addEventListener("click", (e) => {
    const angle = Math.atan2((e.clientY - boundary.top) - player.y, (e.clientX - boundary.left) - player.x);

    const velocity = {
        x: Math.cos(angle) * 6,
        y: Math.sin(angle) * 6,
    }
    console.log(velocity)
    const projectile = new Projectile(player.x, player.y, 5, "white", velocity);
    projectile.draw();
    projectiles.push(projectile);

});


// Event pour reload la page et relancer une partie
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        window.location.reload();
    }
});











// function component(width, height, color, x, y) {
    
//     this.image = new Image();
//     this.image.src = color;
    
//     this.width = width;
//     this.height = height;
//     this.speedX = 0;
//     this.speedY = 0;
//     this.x = x;
//     this.y = y;
//     this.update = function () {
//         ctx = myGameArea.context;
//         if (type == "image") {
//             ctx.drawImage(this.image,
//                 this.x,
//                 this.y,
//                 this.width, this.height);
//         } else {
//             ctx.fillStyle = color;
//             ctx.fillRect(this.x, this.y, this.width, this.height);
//         }
//     }
// }

// let ennemy = new component(100, 100, "/Images/kurbyCat.png", 150, 150);
// ennemy.update();
// ennemy.drawImage();
