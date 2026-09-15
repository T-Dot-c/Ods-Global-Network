import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../api/api";
import { ArrowLeft } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  authorId?: number;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      if (imageUrl.includes('odsglobal.net') && !imageUrl.includes('www.odsglobal.net')) {
        imageUrl = imageUrl.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.odsglobal.net');
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
    if (!slug) {
      setError("Invalid blog post");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${BASE_URL}/posts/${slug}`, {
          timeout: 15000,
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          const data = response.data;
          
          if (!data || typeof data !== 'object') {
            throw new Error("Invalid response format");
          }

          const postData: BlogPost = {
            id: data.id || 0,
            title: String(data.title || "Untitled"),
            slug: String(data.slug || slug),
            excerpt: data.excerpt ? String(data.excerpt) : undefined,
            content: String(data.content || ""),
            coverImage: data.coverImage || data.cover_image ? String(data.coverImage || data.cover_image) : undefined,
            authorId: data.authorId || data.author_id || undefined,
            published: data.published !== undefined ? Boolean(data.published) : true,
            createdAt: String(data.createdAt || data.created_at || ""),
            updatedAt: data.updatedAt || data.updated_at || undefined,
          };

          setPost(postData);
        } else {
          if (response.status === 404) {
            setError("Blog post not found");
          } else {
            const errorData = response.data;
            if (errorData && typeof errorData === 'object') {
              setError(errorData.error || errorData.msg || "Failed to load blog post");
            } else {
              setError("Failed to load blog post");
            }
          }
        }
      } catch (err: any) {
        console.error("Fetch blog error:", err);
        setError("Failed to load blog post. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-500 mb-2">Loading blog post...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#be9b49] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/blogs")}
              className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-lg hover:bg-[#b8962f] transition"
            >
              Back to Blogs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Blog post not found</p>
          <button
            onClick={() => navigate("/blogs")}
            className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-lg hover:bg-[#b8962f] transition"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/blogs")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#0f285b] transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Blogs</span>
        </button>

        {/* Blog Post Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="w-full">
              <img
                src={getImageUrl(post.coverImage)}
                alt={post.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                }}
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            <h1 className="text-4xl font-bold mb-4 text-[#0f285b]">{post.title}</h1>
            
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
              <span>Posted on {new Date(post.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span>Updated on {new Date(post.updatedAt).toLocaleDateString()}</span>
              )}
            </div>

            {post.excerpt && (
              <p className="text-xl text-gray-700 mb-6 italic">{post.excerpt}</p>
            )}

            <div 
              className="prose max-w-none prose-lg prose-headings:text-[#0f285b] prose-a:text-[#be9b49] prose-strong:text-[#0f285b]"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
