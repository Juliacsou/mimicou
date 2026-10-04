const GAME_CATEGORIES = [
  {
    id: "lugares",
    name: "Lugares",
    emoji: "📍",
    words: [
      "Escola", "Hospital", "Aeroporto", "Praia", "Shopping", "Supermercado",
      "Farmácia", "Biblioteca", "Cinema", "Teatro", "Restaurante", "Padaria",
      "Parque", "Igreja", "Academia", "Banco", "Correio", "Delegacia",
      "Posto de gasolina", "Hotel", "Rodoviária", "Estação de trem", "Metrô", "Museu",
      "Castelo", "Fazenda", "Zoológico", "Aquário", "Salão de beleza", "Barbearia",
      "Escritório", "Fábrica", "Universidade", "Creche", "Pet shop", "Feira",
      "Camping", "Ilha", "Floresta", "Deserto"
    ]
  },
  {
    id: "acoes",
    name: "Ações",
    emoji: "🎭",
    words: [
      "Dar marcha ré", "Trocar pneu", "Desentupir pia", "Procurar sinal de internet", "Tentar abrir um pote", "Digitar senha errada",
      "Estacionar", "Trocar lâmpada", "Tirar selfie", "Fazer ligação", "Atender telefone", "Escovar o cachorro",
      "Fazer maquiagem", "Cortar a unha", "Procurar algo perdido", "Empinar pipa", "Jogar videogame", "Dar cambalhota",
      "Pagar uma conta", "Passar no pedágio", "Colocar cinto de segurança", "Tirar foto", "Apagar incêndio", "Lavar o carro",
      "Montar móvel", "Fazer churrasco", "Tirar algo do forno", "Carregar peso", "Remar", "Surfar",
      "Trocar fralda", "Dar banho em bebê", "Tentar pegar algo alto", "Assinar documento", "Jogar boliche", "Abrir guarda-chuva",
      "Fazer café", "Procurar vaga de estacionamento", "Fazer compras", "Passar protetor solar", "Encher balão", "Dobrar lençol",
      "Pescar", "Acampar", "Tirar carteira do bolso", "Entrar em reunião online", "Apresentar trabalho", "Tocar campainha",
      "Fazer tatuagem", "Pintar parede"
    ]
  },
  {
    id: "adjetivos",
    name: "Adjetivos",
    emoji: "✨",
    words: [
      "Feliz", "Triste", "Bravo", "Calmo", "Ansioso", "Corajoso",
      "Medroso", "Rápido", "Lento", "Alto", "Baixo", "Forte",
      "Fraco", "Inteligente", "Distraído", "Engraçado", "Sério", "Generoso",
      "Egoísta", "Paciente", "Impaciente", "Tímido", "Extrovertido", "Elegante",
      "Desleixado", "Organizado", "Bagunceiro", "Gentil", "Mal-humorado", "Curioso",
      "Criativo", "Preguiçoso", "Agitado", "Silencioso", "Barulhento", "Otimista",
      "Pessimista", "Educado", "Teimoso", "Amigável"
    ]
  },
  {
    id: "profissoes",
    name: "Profissões",
    emoji: "💼",
    words: [
      "Médico", "Enfermeiro", "Professor", "Advogado", "Engenheiro", "Programador",
      "Dentista", "Veterinário", "Policial", "Bombeiro", "Piloto", "Comissário de bordo",
      "Motorista", "Padeiro", "Cozinheiro", "Garçom", "Mecânico", "Eletricista",
      "Pintor", "Pedreiro", "Arquiteto", "Jornalista", "Fotógrafo", "Ator",
      "Cantor", "Dançarino", "Farmacêutico", "Psicólogo", "Recepcionista", "Secretário",
      "Contador", "Carteiro", "Cabeleireiro", "Barbeiro", "Segurança", "Juiz",
      "Astronauta", "Cientista", "Agricultor", "Vendedor"
    ]
  },
  {
    id: "pessoas",
    name: "Pessoas",
    emoji: "👥",
    words: [
      "Bebê", "Criança", "Adolescente", "Mãe", "Pai", "Avó",
      "Avô", "Irmão", "Irmã", "Tio", "Tia", "Primo",
      "Prima", "Vizinho", "Amigo", "Namorado", "Namorada", "Noivo",
      "Noiva", "Marido", "Esposa", "Professor", "Aluno", "Chefe",
      "Funcionário", "Cliente", "Turista", "Atleta", "Músico", "Artista"
    ]
  },
  {
    id: "marcas",
    name: "Marcas",
    emoji: "🏷️",
    words: [
      "Nike", "Adidas", "Puma", "Apple", "Samsung", "Motorola",
      "Xiaomi", "LG", "Sony", "Nintendo", "PlayStation", "Xbox",
      "Coca-Cola", "Pepsi", "McDonald's", "Burger King", "KFC", "Subway",
      "Nestlé", "Lacta", "Garoto", "Bauducco", "Havaianas", "Colgate",
      "Oral-B", "Gillette", "Nivea", "Omo", "Ypê", "Volkswagen",
      "Toyota", "Honda", "Ford", "Chevrolet", "Hyundai", "Itaú",
      "Bradesco", "Nubank", "Amazon", "Google"
    ]
  },
  {
    id: "filmes-populares",
    name: "Filmes Populares",
    emoji: "🎬",
    words: [
      "Titanic", "Avatar", "Vingadores Ultimato", "Homem-Aranha", "Batman", "Interestelar",
      "Top Gun Maverick", "Jurassic Park", "Matrix", "Gladiador", "O Senhor dos Anéis", "Harry Potter",
      "Jogos Vorazes", "Pantera Negra", "Deadpool", "Shrek", "Barbie", "Oppenheimer",
      "Frozen", "Divertida Mente", "Procurando Nemo", "Toy Story", "Moana", "Encanto",
      "Coco", "Minions", "Transformers", "Missão Impossível", "John Wick", "Rocky",
      "Creed", "Forrest Gump", "Clube da Luta", "Se Beber Não Case", "A Origem", "Up",
      "Wall-E", "Ratatouille", "Os Incríveis", "Carros"
    ]
  },
  {
    id: "filmes-infantis",
    name: "Filmes Infantis",
    emoji: "🍿",
    words: [
      "Toy Story", "Frozen", "Moana", "Encanto", "Coco", "Divertida Mente",
      "Procurando Nemo", "Procurando Dory", "Monstros S.A.", "Universidade Monstros", "Carros", "Carros 2",
      "Carros 3", "Ratatouille", "Wall-E", "Up", "Valente", "Luca",
      "Red Crescer é uma Fera", "A Pequena Sereia", "Aladdin", "Mulan", "Tarzan", "Rei Leão",
      "Bambi", "Dumbo", "Pinóquio", "Branca de Neve", "Cinderela", "A Bela e a Fera",
      "Enrolados", "Zootopia", "Sing", "Meu Malvado Favorito", "Minions", "Madagascar",
      "Kung Fu Panda", "Shrek", "Os Croods", "Hotel Transilvânia"
    ]
  },
  {
    id: "series-populares",
    name: "Séries Populares",
    emoji: "📺",
    words: [
      "Todo Mundo Odeia o Chris", "Chaves", "Chapolin", "Bob Esponja", "Os Simpsons", "Pica-Pau",
      "Scooby-Doo", "Tom e Jerry", "Ben 10", "Hora de Aventura", "Os Jovens Titãs", "Pokémon",
      "Dragon Ball Z", "Naruto", "Friends", "The Office", "Eu, a Patroa e as Crianças", "Um Maluco no Pedaço",
      "Todo Mundo em Pânico", "ICarly", "Drake & Josh", "Hannah Montana", "Zack & Cody", "As Visões da Raven",
      "Grey's Anatomy", "The Walking Dead", "Stranger Things", "Round 6", "Wandinha", "Cobra Kai",
      "Brooklyn 99", "Breaking Bad", "Game of Thrones", "House", "Lost", "Supernatural",
      "The Flash", "Smallville", "Loki", "The Mandalorian"
    ]
  },
  {
    id: "atores-atrizes",
    name: "Atores e Atrizes",
    emoji: "🎭",
    words: [
      "Tom Hanks", "Leonardo DiCaprio", "Brad Pitt", "Angelina Jolie", "Jennifer Aniston", "Scarlett Johansson",
      "Robert Downey Jr", "Chris Evans", "Chris Hemsworth", "Emma Watson", "Daniel Radcliffe", "Rupert Grint",
      "Morgan Freeman", "Will Smith", "Dwayne Johnson", "Keanu Reeves", "Johnny Depp", "Natalie Portman",
      "Anne Hathaway", "Margot Robbie", "Ryan Reynolds", "Ryan Gosling", "Zendaya", "Tom Holland",
      "Benedict Cumberbatch", "Samuel L Jackson", "Gal Gadot", "Henry Cavill", "Jenna Ortega", "Pedro Pascal",
      "Viola Davis", "Meryl Streep", "Julia Roberts", "Sandra Bullock", "Jim Carrey", "Adam Sandler",
      "Robin Williams", "Selton Mello", "Fernanda Montenegro", "Tony Ramos"
    ]
  },
  {
    id: "personagens-famosos",
    name: "Personagens Famosos",
    emoji: "🦸",
    words: [
      "Harry Potter", "Hermione", "Ron Weasley", "Homem-Aranha", "Batman", "Superman",
      "Mulher-Maravilha", "Homem de Ferro", "Capitão América", "Thor", "Hulk", "Loki",
      "Darth Vader", "Yoda", "Luke Skywalker", "Elsa", "Anna", "Olaf",
      "Mickey Mouse", "Pateta", "Pato Donald", "Buzz Lightyear", "Woody", "Shrek",
      "Burro", "Gato de Botas", "Pikachu", "Mario", "Luigi", "Sonic",
      "Tails", "Naruto", "Sasuke", "Goku", "Vegeta", "Luffy",
      "Zoro", "Scooby-Doo", "Salsicha", "Bob Esponja", "Patrick", "Peppa Pig",
      "Simba", "Mufasa", "Aladdin", "Genie", "Mulan", "Tarzan",
      "Pernalonga", "Coringa"
    ]
  },
  {
    id: "bandas-famosas",
    name: "Bandas Famosas",
    emoji: "🎸",
    words: [
      "The Beatles", "Queen", "Coldplay", "Imagine Dragons", "Maroon 5", "Linkin Park",
      "U2", "Bon Jovi", "Metallica", "Nirvana", "Red Hot Chili Peppers", "ABBA",
      "Bee Gees", "Aerosmith", "Guns N Roses", "Kiss", "Pink Floyd", "The Rolling Stones",
      "AC/DC", "OneRepublic", "Legião Urbana", "Titãs", "Skank", "Jota Quest",
      "Roupa Nova", "Paralamas do Sucesso", "NX Zero", "Charlie Brown Jr", "Evanescence", "Black Eyed Peas"
    ]
  },
  {
    id: "musicos-famosos",
    name: "Músicos Famosos",
    emoji: "🎤",
    words: [
      "Taylor Swift", "Ed Sheeran", "Bruno Mars", "Adele", "Beyoncé", "Michael Jackson",
      "Elvis Presley", "Madonna", "Justin Bieber", "Lady Gaga", "Shakira", "Rihanna",
      "Billie Eilish", "Drake", "Eminem", "The Weeknd", "Anitta", "Ivete Sangalo",
      "Roberto Carlos", "Luan Santana", "Gusttavo Lima", "Marília Mendonça", "Jorge", "Mateus",
      "Zezé Di Camargo", "Luciano", "Alok", "Djavan", "Caetano Veloso", "Gilberto Gil",
      "Elton John", "Freddie Mercury", "John Lennon", "Paul McCartney", "Miley Cyrus", "Selena Gomez",
      "Olivia Rodrigo", "Sabrina Carpenter", "Post Malone", "Katy Perry"
    ]
  },
  {
    id: "animais",
    name: "Animais",
    emoji: "🐾",
    words: [
      "Cachorro", "Gato", "Leão", "Tigre", "Elefante", "Girafa",
      "Zebra", "Macaco", "Gorila", "Urso", "Panda", "Coelho",
      "Hamster", "Cavalo", "Vaca", "Porco", "Galinha", "Pato",
      "Águia", "Coruja", "Papagaio", "Pinguim", "Golfinho", "Baleia",
      "Tubarão", "Polvo", "Crocodilo", "Jacaré", "Cobra", "Lagarto",
      "Camaleão", "Sapo", "Rã", "Formiga", "Abelha", "Borboleta",
      "Aranha", "Escorpião", "Lobo", "Raposa", "Canguru", "Koala",
      "Hipopótamo", "Rinoceronte", "Onça", "Capivara", "Lhama", "Ovelha",
      "Cabra", "Peru"
    ]
  },
  {
    id: "corpo-humano",
    name: "Corpo Humano",
    emoji: "🫀",
    words: [
      "Cabeça", "Olho", "Nariz", "Boca", "Orelha", "Pescoço",
      "Ombro", "Braço", "Cotovelo", "Pulso", "Mão", "Dedo",
      "Peito", "Costas", "Barriga", "Quadril", "Perna", "Joelho",
      "Tornozelo", "Pé", "Cabelo", "Sobrancelha", "Cílios", "Língua",
      "Dente", "Queixo", "Testa", "Coração", "Pulmão", "Estômago"
    ]
  },
  {
    id: "pessoas-famosas",
    name: "Pessoas Famosas",
    emoji: "🌟",
    words: [
      "Neymar", "Pelé", "Cristiano Ronaldo", "Lionel Messi", "Michael Jordan", "Usain Bolt",
      "Ayrton Senna", "Lewis Hamilton", "Bill Gates", "Steve Jobs", "Elon Musk", "Mark Zuckerberg",
      "Oprah Winfrey", "Princesa Diana", "Rei Charles III", "Papa Francisco", "Albert Einstein", "Isaac Newton",
      "Marie Curie", "Stephen Hawking", "Walt Disney", "MrBeast", "Whindersson Nunes", "Felipe Neto",
      "Virginia Fonseca", "Silvio Santos", "Xuxa", "Faustão", "Gisele Bündchen", "Mahatma Gandhi",
      "Nelson Mandela", "Martin Luther King Jr", "Abraham Lincoln", "Cleópatra", "Júlio César", "Napoleão",
      "Dom Pedro I", "Santos Dumont", "Tarsila do Amaral", "Machado de Assis", "Monteiro Lobato", "J. K. Rowling",
      "Stephen King", "Greta Thunberg", "Malala", "Tony Hawk", "Ronaldo Fenômeno", "Ronaldinho Gaúcho",
      "Kobe Bryant", "LeBron James"
    ]
  },
  {
    id: "pontos-turisticos",
    name: "Pontos Turísticos",
    emoji: "🗺️",
    words: [
      "Cristo Redentor", "Torre Eiffel", "Estátua da Liberdade", "Big Ben", "Coliseu", "Taj Mahal",
      "Muralha da China", "Pirâmides do Egito", "Disney World", "Pão de Açúcar", "Cataratas do Iguaçu", "Machu Picchu",
      "Monte Rushmore", "Arco do Triunfo", "Louvre", "Times Square", "Hollywood", "Letreiro de Hollywood",
      "Central Park", "Golden Gate", "Burj Khalifa", "Ópera de Sydney", "Stonehenge", "Monte Fuji",
      "Niagara Falls", "Sagrada Família", "Petra", "Acrópole", "Lençóis Maranhenses", "Museu do Amanhã"
    ]
  },
  {
    id: "comidas",
    name: "Comidas",
    emoji: "🍕",
    words: [
      "Pizza", "Hambúrguer", "Hot dog", "Lasanha", "Macarrão", "Feijoada",
      "Churrasco", "Arroz", "Feijão", "Strogonoff", "Purê de batata", "Batata frita",
      "Salada", "Sopa", "Panqueca", "Omelete", "Coxinha", "Pastel",
      "Pão de queijo", "Esfiha", "Kibe", "Sushi", "Temaki", "Yakisoba",
      "Taco", "Burrito", "Nachos", "Sorvete", "Bolo", "Brigadeiro",
      "Beijinho", "Pudim", "Chocolate", "Maçã", "Banana", "Morango",
      "Melancia", "Uva", "Laranja", "Abacaxi", "Manga", "Pera",
      "Cenoura", "Brocólis", "Tomate", "Queijo", "Iogurte", "Pipoca",
      "Donut", "Croissant"
    ]
  },
  {
    id: "objetos",
    name: "Objetos",
    emoji: "🎒",
    words: [
      "Celular", "Computador", "Notebook", "Tablet", "Televisão", "Controle remoto",
      "Teclado", "Mouse", "Fone de ouvido", "Relógio", "Óculos", "Espelho",
      "Escova", "Pente", "Toalha", "Sabonete", "Shampoo", "Escova de dentes",
      "Pasta de dentes", "Tesoura", "Caneta", "Lápis", "Borracha", "Caderno",
      "Livro", "Mochila", "Mala", "Carteira", "Chave", "Cadeado",
      "Lanterna", "Guarda-chuva", "Ventilador", "Geladeira", "Micro-ondas", "Fogão",
      "Panela", "Prato", "Copo", "Talher", "Garrafa", "Vassoura",
      "Rodo", "Balde", "Martelo", "Serrote", "Parafuso", "Furadeira",
      "Almofada", "Cobertor", "Travesseiro", "Sofá", "Mesa", "Cadeira",
      "Lâmpada", "Tomada", "Carregador", "Câmera", "Violão", "Bola"
    ]
  },
  {
    id: "transportes",
    name: "Transportes",
    emoji: "🚗",
    words: [
      "Carro", "Ônibus", "Moto", "Bicicleta", "Caminhão", "Van",
      "Táxi", "Metrô", "Trem", "Avião", "Helicóptero", "Navio",
      "Barco", "Canoa", "Jet ski", "Patinete", "Skate", "Trator",
      "Ambulância", "Viatura", "Carro de bombeiro", "Foguete", "Balão", "Teleférico",
      "Monotrilho", "Bonde", "Limusine", "Carroça", "Submarino", "Iate"
    ]
  },
  {
    id: "vestuario",
    name: "Vestuário",
    emoji: "👕",
    words: [
      "Camiseta", "Camisa", "Calça", "Shorts", "Saia", "Vestido",
      "Blusa", "Moletom", "Jaqueta", "Casaco", "Terno", "Gravata",
      "Meia", "Sapato", "Tênis", "Sandália", "Chinelo", "Boné",
      "Chapéu", "Cinto", "Luva", "Cachecol", "Óculos de sol", "Relógio",
      "Brinco", "Colar", "Pulseira", "Anel", "Pijama", "Fantasia"
    ]
  },
  {
    id: "futebol",
    name: "Futebol",
    emoji: "⚽",
    words: [
      "Gol", "Pênalti", "Escanteio", "Falta", "Impedimento", "Goleiro",
      "Zagueiro", "Atacante", "Técnico", "Torcida", "Capitão", "Cartão amarelo",
      "Cartão vermelho", "Cabeceio", "Drible", "Chuteira", "Trave", "Rede",
      "Copa do Mundo", "Libertadores", "Champions League", "Palmeiras", "Corinthians", "São Paulo",
      "Santos", "Flamengo", "Vasco", "Grêmio", "Internacional", "Cruzeiro",
      "Atlético Mineiro", "Botafogo", "Fluminense", "Barcelona", "Real Madrid", "Manchester City",
      "Liverpool", "PSG", "Messi", "Cristiano Ronaldo"
    ]
  },
  {
    id: "esportes",
    name: "Esportes",
    emoji: "🏅",
    words: [
      "Basquete", "Vôlei", "Tênis", "Natação", "Atletismo", "Ginástica",
      "Handebol", "Rugby", "Beisebol", "Hóquei", "Golfe", "Surfe",
      "Skate", "Judô", "Karatê", "Taekwondo", "Boxe", "Ciclismo",
      "Escalada", "Esgrima", "Remo", "Canoagem", "Triatlo", "Badminton",
      "Tênis de mesa", "Futsal", "Polo aquático", "Wrestling", "Hipismo", "Arco e flecha"
    ]
  },
  {
    id: "aplicativos",
    name: "Aplicativos",
    emoji: "📱",
    words: [
      "WhatsApp", "Instagram", "Facebook", "TikTok", "YouTube", "Netflix",
      "Spotify", "Uber", "iFood", "Telegram", "X", "Threads",
      "Pinterest", "LinkedIn", "Google Maps", "Waze", "Discord", "Zoom",
      "Teams", "Gmail", "Google Drive", "Google Fotos", "Canva", "CapCut",
      "Duolingo", "Tinder", "Twitch", "Amazon", "Mercado Livre", "ChatGPT"
    ]
  },
  {
    id: "jogos-famosos",
    name: "Jogos Famosos",
    emoji: "🎮",
    words: [
      "Minecraft", "Roblox", "Free Fire", "GTA", "Fortnite", "Super Mario Bros",
      "Mario Kart", "Pokémon", "The Sims", "Among Us", "Brawl Stars", "Clash Royale",
      "Candy Crush", "Pac-Man", "Sonic", "FIFA", "EA FC", "Call of Duty",
      "Counter-Strike", "League of Legends", "Valorant", "Clash of Clans", "Angry Birds", "Subway Surfers",
      "Temple Run", "Fall Guys", "Rocket League", "Zelda", "God of War", "Resident Evil",
      "The Last of Us", "Mortal Kombat", "Street Fighter", "Just Dance", "Guitar Hero", "Tetris",
      "Wii Sports", "Need for Speed", "Bomberman", "Mario Party"
    ]
  },
  {
    id: "sud",
    name: "SUD",
    emoji: "⛪",
    words: [
      "Templo", "Missionário", "Missionária", "Bispo", "Presidente da Estaca", "Ala",
      "Estaca", "Sacramento", "Batismo", "Confirmação", "Livro de Mórmon", "Doutrina e Convênios",
      "Pérola de Grande Valor", "Joseph Smith", "Morôni", "Néfi", "Leí", "Alma",
      "Mosias", "Helamã", "Liahona", "Placas de Ouro", "Anjo Morôni", "Primária",
      "Seminário", "Instituto", "Sociedade de Socorro", "Quórum de Élderes", "Rapazes", "Moças",
      "História da Família", "Selamento", "Recomendação para o Templo", "Conferência Geral", "Noite Familiar", "Jejum",
      "Dízimo", "Testemunho", "Profeta", "Apóstolo"
    ]
  }
];
