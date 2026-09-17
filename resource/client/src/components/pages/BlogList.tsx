import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../api/api";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  createdAt: string;
}

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "recent">("recent");

  // Build image URL safely
  const getImageUrl = (imageUrl?: string): string => {
    if (!imageUrl || imageUrl.trim() === '') {
      return "/placeholder.png";
    }
    
    // If already a full URL, normalize it
    if (imageUrl.startsWith('http')) {
      if (imageUrl.includes('/api/uploads/')) {
        imageUrl = imageUrl.replace('/api/uploads/', '/uploads/');
      }
      if (imageUrl.includes('wanaw.et') && !imageUrl.includes('www.wanaw.et')) {
        imageUrl = imageUrl.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.wanaw.et');
      }
      return imageUrl;
    }
    
    // For relative paths, construct the full URL
    let serverBase: string;
    if (BASE_URL.startsWith('http')) {
      serverBase = BASE_URL.replace('/api', '').replace(/\/$/, '');
    } else {
      serverBase = 'http://localhost:5000';
    }
    
    // Handle both /uploads/... and uploads/... formats
    if (imageUrl.startsWith('/uploads')) {
      return `${serverBase}${imageUrl}`;
    }
    if (imageUrl.startsWith('uploads')) {
      return `${serverBase}/${imageUrl}`;
    }
    // If it's just a filename
    return `${serverBase}/uploads/${imageUrl}`;
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${BASE_URL}/posts`, {
          timeout: 15000,
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          const data = response.data;
          
          if (!Array.isArray(data)) {
            setError("Invalid response format");
            return;
          }

          // Sanitize blog posts
          const sanitizedPosts: BlogPost[] = data
            .map((post: any) => ({
              id: parseInt(String(post.id)) || 0,
              title: String(post.title || "Untitled"),
              slug: String(post.slug || ""),
              excerpt: post.excerpt ? String(post.excerpt) : undefined,
              coverImage: post.coverImage || post.cover_image ? String(post.coverImage || post.cover_image) : undefined,
              createdAt: String(post.createdAt || post.created_at || ""),
            }))
            .filter((post: BlogPost) => post.id > 0 && post.slug); // Filter out invalid posts

          // Sort by date (newest first)
          sanitizedPosts.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });

          setPosts(sanitizedPosts);
        } else {
          setError("Failed to load blog posts");
        }
      } catch (err: any) {
        console.error("Error fetching blog posts:", err);
        setError("Failed to load blog posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts based on selection
  const filteredPosts = filter === "recent" 
    ? posts.slice(0, 6) // Show only recent 6 posts
    : posts; // Show all posts

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-500 mb-2">Loading blog posts...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#D4AF37] text-[#1c2b21] font-bold rounded-lg hover:bg-[#b8962f] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1c2b21] mb-4">Blog Posts</h1>
          <p className="text-gray-600 text-lg">Stay updated with our latest news and insights</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setFilter("recent")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              filter === "recent"
                ? "bg-[#1c2b21] text-white"
                : "bg-white text-[#1c2b21] hover:bg-gray-100"
            }`}
          >
            Recent Posts
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              filter === "all"
                ? "bg-[#1c2b21] text-white"
                : "bg-white text-[#1c2b21] hover:bg-gray-100"
            }`}
          >
            All Posts ({posts.length})
          </button>
        </div>

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts available</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blogs/${post.slug}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {/* Cover Image */}
                {post.coverImage ? (
                  <div className="w-full h-64 overflow-hidden">
                    <img
                      src={getImageUrl(post.coverImage)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.png";
                      }}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#1c2b21] mb-2 group-hover:text-[#D4AF37] transition">
                    {post.title}
                  </h3>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <span className="text-[#D4AF37] font-semibold group-hover:underline">
                      Read More →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;





































