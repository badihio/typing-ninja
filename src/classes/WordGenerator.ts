import { Difficulty } from '../types/index.js';

export class WordGenerator {
    private static wordLists: { [key in Difficulty]: string[] } = {
        beginner: [
            'cat', 'dog', 'run', 'jump', 'fast', 'slow', 'big', 'small', 'red', 'blue',
            'car', 'bus', 'sun', 'moon', 'star', 'tree', 'fish', 'bird', 'book', 'pen',
            'cup', 'box', 'key', 'door', 'wall', 'floor', 'hand', 'foot', 'head', 'eye'
        ],
        intermediate: [
            'computer', 'keyboard', 'monitor', 'program', 'website', 'internet', 'software',
            'hardware', 'database', 'network', 'security', 'password', 'download', 'upload',
            'browser', 'smartphone', 'tablet', 'wireless', 'bluetooth', 'technology',
            'digital', 'virtual', 'online', 'offline', 'system', 'application', 'interface',
            'platform', 'framework', 'algorithm'
        ],
        master: [
            'programming', 'development', 'architecture', 'optimization', 'implementation',
            'documentation', 'maintenance', 'scalability', 'performance', 'efficiency',
            'integration', 'deployment', 'configuration', 'authentication', 'authorization',
            'encryption', 'decryption', 'compression', 'synchronization', 'asynchronous',
            'debugging', 'refactoring', 'inheritance', 'polymorphism', 'abstraction',
            'encapsulation', 'instantiation', 'serialization', 'deserialization', 'middleware'
        ],
        ninja: [
            'encapsulation', 'polymorphism', 'inheritance', 'abstraction', 'instantiation',
            'serialization', 'deserialization', 'synchronization', 'asynchronous', 'multithreading',
            'concurrency', 'parallelism', 'optimization', 'profiling', 'benchmarking',
            'microservices', 'containerization', 'orchestration', 'virtualization', 'scalability',
            'distributed', 'decentralized', 'cryptographic', 'authentication', 'authorization',
            'middleware', 'framework', 'architecture', 'infrastructure', 'implementation'
        ]
    };

    private static usedWords: Set<string> = new Set();

    static getRandomWord(difficulty: Difficulty): string {
        const words = this.wordLists[difficulty];
        const availableWords = words.filter(word => !this.usedWords.has(word));
        
        if (availableWords.length === 0) {
            this.usedWords.clear();
            return words[Math.floor(Math.random() * words.length)];
        }
        
        const word = availableWords[Math.floor(Math.random() * availableWords.length)];
        this.usedWords.add(word);
        return word;
    }

    static clearUsedWords(): void {
        this.usedWords.clear();
    }
}
